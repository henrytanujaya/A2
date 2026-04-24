package com.otaku.ecommerce.service;

import com.otaku.ecommerce.dto.ProductDTO;
import com.otaku.ecommerce.dto.ProductRequestDTO;
import com.otaku.ecommerce.entity.Product;
import com.otaku.ecommerce.exception.CustomBusinessException;
import com.otaku.ecommerce.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProductService {

    @Autowired
    private ProductRepository productRepository;

    // ─── Get All Products (Public) ────────────────────────────────────────────
    public List<ProductDTO> getAllProducts() {
        return productRepository.findAll().stream().map(this::toDTO).collect(Collectors.toList());
    }

    // ─── Get Product by ID (Public) ───────────────────────────────────────────
    public ProductDTO getProductById(Integer id) {
        if (id == null) throw new CustomBusinessException("OTK-4010", "ID tidak boleh kosong", 400);
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new CustomBusinessException("OTK-4044", "Produk tidak ditemukan", 404));
        return toDTO(product);
    }

    // ─── Create Product (Admin) ───────────────────────────────────────────────
    public ProductDTO createProduct(ProductRequestDTO request) {
        Product product = new Product();
        product.setCategory(request.getCategory());
        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setPrice(request.getPrice());
        product.setStockQuantity(request.getStockQuantity());
        product.setImageUrl(request.getImageUrl());
        return toDTO(productRepository.save(product));
    }

    // ─── Update Product (Admin) ───────────────────────────────────────────────
    public ProductDTO updateProduct(Integer id, ProductRequestDTO request) {
        if (id == null) throw new CustomBusinessException("OTK-4010", "ID tidak boleh kosong", 400);
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new CustomBusinessException("OTK-4044", "Produk tidak ditemukan", 404));
        product.setCategory(request.getCategory());
        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setPrice(request.getPrice());
        product.setStockQuantity(request.getStockQuantity());
        product.setImageUrl(request.getImageUrl());
        return toDTO(productRepository.save(product));
    }

    // ─── Delete Product (Admin) ───────────────────────────────────────────────
    public void deleteProduct(Integer id) {
        if (id == null) throw new CustomBusinessException("OTK-4010", "ID tidak boleh kosong", 400);
        if (!productRepository.existsById(id))
            throw new CustomBusinessException("OTK-4044", "Produk tidak ditemukan", 404);
        productRepository.deleteById(id);
    }

    // ─── Update Stock Only (Admin) ────────────────────────────────────────────
    public void updateStock(Integer id, Integer quantity) {
        if (id == null) throw new CustomBusinessException("OTK-4010", "ID tidak boleh kosong", 400);
        if (quantity == null || quantity < 0)
            throw new CustomBusinessException("OTK-4013", "Stok tidak boleh negatif atau null", 400);
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new CustomBusinessException("OTK-4044", "Produk tidak ditemukan", 404));
        product.setStockQuantity(quantity);
        productRepository.save(product);
    }

    // ─── Helper ───────────────────────────────────────────────────────────────
    private ProductDTO toDTO(Product product) {
        ProductDTO dto = new ProductDTO();
        dto.setId(product.getId());
        dto.setCategory(product.getCategory());
        dto.setName(product.getName());
        dto.setDescription(product.getDescription());
        dto.setPrice(product.getPrice());
        dto.setStockQuantity(product.getStockQuantity());
        dto.setImageUrl(product.getImageUrl());
        dto.setCreatedAt(product.getCreatedAt());
        dto.setRating(product.getRating());
        dto.setWeight(product.getWeight());
        return dto;
    }
}
