# Tahap 1: Build Backend menggunakan Maven
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
# Unduh dependency (cache layer)
RUN mvn dependency:go-offline -B
COPY src ./src
# Build aplikasi tanpa menjalankan testing untuk mempercepat proses build Docker
RUN mvn clean package -DskipTests

# Tahap 2: Setup Runtime menggunakan JRE
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
# Menyalin file jar dari tahap 1
COPY --from=build /app/target/*.jar app.jar

# Buat direktori lokal untuk upload jika dibutuhkan
RUN mkdir -p uploads/outfits uploads/figures

EXPOSE 8321
ENTRYPOINT ["java", "-jar", "app.jar"]
