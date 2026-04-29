package com.otaku.ecommerce.service;

import com.otaku.ecommerce.dto.OrderItemRequestDTO;
import com.otaku.ecommerce.dto.OrderRequestDTO;
import com.otaku.ecommerce.dto.OrderResponseDTO;
import com.otaku.ecommerce.entity.*;
import com.otaku.ecommerce.exception.CustomBusinessException;
import com.otaku.ecommerce.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
public class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;
    @Mock
    private OrderItemRepository orderItemRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private ProductRepository productRepository;
    @Mock
    private CustomOrderRepository customOrderRepository;
    @Mock
    private DiscountRepository discountRepository;
    @Mock
    private OrderTrackingRepository orderTrackingRepository;
    @Mock
    private PaymentLogRepository paymentLogRepository;
    @Mock
    private PaymentProofRepository paymentProofRepository;

    @InjectMocks
    private OrderService orderService;

    private User mockUser;
    private Product mockProduct;

    @BeforeEach
    void setUp() {
        mockUser = new User();
        mockUser.setId(1);
        mockUser.setEmail("test@test.com");
        mockUser.setName("Test User");

        mockProduct = new Product();
        mockProduct.setId(101);
        mockProduct.setName("Test Product");
        mockProduct.setPrice(new BigDecimal("100000.00"));
        mockProduct.setStockQuantity(10);
    }

    @Test
    void testCreateOrder_Success_WithoutDiscount() {
        // Given
        OrderRequestDTO request = new OrderRequestDTO();
        request.setShippingAddress("Alamat Test");
        
        OrderItemRequestDTO itemDTO = new OrderItemRequestDTO();
        itemDTO.setProductId(101);
        itemDTO.setQuantity(2); // Total = 200000
        request.setItems(List.of(itemDTO));

        when(userRepository.findByEmail("test@test.com")).thenReturn(Optional.of(mockUser));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> {
            Order order = invocation.getArgument(0);
            if (order.getId() == null) order.setId(1001); // Mock saved ID
            return order;
        });
        when(orderRepository.findById(1001)).thenAnswer(invocation -> {
            Order order = new Order();
            order.setId(1001);
            return Optional.of(order);
        });
        when(productRepository.findById(101)).thenReturn(Optional.of(mockProduct));

        // When
        OrderResponseDTO response = orderService.createOrder(request, "test@test.com");

        // Then
        assertNotNull(response);
        assertEquals(0, new BigDecimal("200000.00").compareTo(response.getTotalAmount()));
        assertEquals(0, new BigDecimal("200000.00").compareTo(response.getFinalAmount()));
        assertEquals("Pending", response.getStatus());

        // Verify product stock was reduced
        assertEquals(8, mockProduct.getStockQuantity());
        verify(productRepository, times(1)).save(mockProduct);
        verify(orderRepository, atLeastOnce()).save(any(Order.class));
        verify(orderItemRepository, times(1)).save(any(OrderItem.class));
        verify(orderTrackingRepository, atLeastOnce()).save(any(OrderTracking.class));
    }

    @Test
    void testCreateOrder_WithPercentageDiscount() {
        // Given
        OrderRequestDTO request = new OrderRequestDTO();
        request.setShippingAddress("Alamat Test");
        request.setDiscountCode("DISC50");

        OrderItemRequestDTO itemDTO = new OrderItemRequestDTO();
        itemDTO.setProductId(101);
        itemDTO.setQuantity(2); // Total = 200000
        request.setItems(List.of(itemDTO));

        Discount discount = new Discount();
        discount.setCode("DISC50");
        discount.setIsActive(true);
        discount.setUsageCount(0);
        discount.setMaxUsage(10);
        discount.setExpiryDate(LocalDateTime.now().plusDays(1));
        discount.setDiscountType("Percentage");
        discount.setDiscountValue(new BigDecimal("50")); // 50%

        when(userRepository.findByEmail("test@test.com")).thenReturn(Optional.of(mockUser));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> {
            Order order = invocation.getArgument(0);
            if (order.getId() == null) order.setId(1002);
            return order;
        });
        when(orderRepository.findById(1002)).thenAnswer(invocation -> {
            Order order = new Order();
            order.setId(1002);
            return Optional.of(order);
        });
        when(productRepository.findById(101)).thenReturn(Optional.of(mockProduct));
        when(discountRepository.findByCode("DISC50")).thenReturn(Optional.of(discount));

        // When
        OrderResponseDTO response = orderService.createOrder(request, "test@test.com");

        // Then
        assertNotNull(response);
        assertEquals(0, new BigDecimal("200000.00").compareTo(response.getTotalAmount()));
        assertEquals(0, new BigDecimal("100000.00").compareTo(response.getFinalAmount())); // 50% of 200K
        assertEquals(1, discount.getUsageCount());
        verify(discountRepository, times(1)).save(discount);
    }

    @Test
    void testCreateOrder_StockInsufficient_ThrowsException() {
        // Given
        OrderRequestDTO request = new OrderRequestDTO();
        OrderItemRequestDTO itemDTO = new OrderItemRequestDTO();
        itemDTO.setProductId(101);
        itemDTO.setQuantity(15); // Stock is only 10
        request.setItems(List.of(itemDTO));

        when(userRepository.findByEmail("test@test.com")).thenReturn(Optional.of(mockUser));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(productRepository.findById(101)).thenReturn(Optional.of(mockProduct));

        // When & Then
        CustomBusinessException exception = assertThrows(CustomBusinessException.class, () -> {
            orderService.createOrder(request, "test@test.com");
        });
        
        assertEquals(409, exception.getStatusCode());
        assertTrue(exception.getMessage().contains("Stok produk 'Test Product' tidak mencukupi"));
    }

    @Test
    void testUpdateOrderStatus_ValidTransition() {
        // Given
        Order order = new Order();
        order.setId(1003);
        order.setStatus("Pending");

        when(orderRepository.findById(1003)).thenReturn(Optional.of(order));

        // When
        orderService.updateOrderStatus(1003, "Processing");

        // Then - Dalam Audit-driven flow, Pending -> Processing (Bukan langsung Shipped)
        assertEquals("Processing", order.getStatus());
        verify(orderRepository, times(1)).save(order);
        verify(orderTrackingRepository, atLeastOnce()).save(any(OrderTracking.class));
    }

    @Test
    void testCancelOrder_Success() {
        // Given
        Order order = new Order();
        order.setId(1005);
        order.setStatus("Pending");
        
        OrderItem item = new OrderItem();
        item.setProduct(mockProduct);
        item.setQuantity(2);
        order.setItems(List.of(item));
        order.setUser(mockUser);

        when(orderRepository.findById(1005)).thenReturn(Optional.of(order));
        int initialStock = mockProduct.getStockQuantity(); // 10

        // When
        orderService.cancelOrder(1005, mockUser.getEmail());

        // Then
        assertEquals("Cancelled", order.getStatus());
        verify(orderRepository, times(1)).save(order);
        verify(productRepository, times(1)).increaseStock(101, 2);
    }

    @Test
    void testUpdateOrderStatus_InvalidTransition_ThrowsException() {
        // Given
        Order order = new Order();
        order.setId(1004);
        order.setStatus("Completed"); // Completed has no valid transitions

        when(orderRepository.findById(1004)).thenReturn(Optional.of(order));

        // When & Then
        CustomBusinessException exception = assertThrows(CustomBusinessException.class, () -> {
            orderService.updateOrderStatus(1004, "Pending");
        });
        
        assertEquals(400, exception.getStatusCode());
        assertTrue(exception.getMessage().contains("Status tidak bisa diubah"));
    }
}
