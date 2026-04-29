-- Create Invoices Table
CREATE TABLE Invoices (
    InvoiceID INT IDENTITY(1,1) PRIMARY KEY,
    OrderID INT NOT NULL,
    InvoiceNumber NVARCHAR(100) NOT NULL UNIQUE,
    TotalAmount DECIMAL(18, 2) NOT NULL,
    IssueDate DATETIME2 DEFAULT GETDATE(),
    Status NVARCHAR(50) DEFAULT 'ISSUED',
    CONSTRAINT FK_Invoices_Orders FOREIGN KEY (OrderID) REFERENCES Orders(OrderID)
);

-- Create PaymentProofs Table
CREATE TABLE PaymentProofs (
    ProofID INT IDENTITY(1,1) PRIMARY KEY,
    OrderID INT NOT NULL,
    ProofType NVARCHAR(100) NOT NULL,
    ProofURL NVARCHAR(500),
    ExternalReference NVARCHAR(255),
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    Description NVARCHAR(MAX),
    CONSTRAINT FK_PaymentProofs_Orders FOREIGN KEY (OrderID) REFERENCES Orders(OrderID)
);
