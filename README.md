# Realtime Delivery Microservices

## Description

Ce projet est un mini-projet académique basé sur une architecture microservices avec Node.js.

L'application représente un système de livraison en temps réel. Elle permet de gérer les commandes, les livraisons et les livreurs à travers trois microservices indépendants.

Le client communique avec une API Gateway. Ensuite, l'API Gateway communique avec les microservices en utilisant gRPC.

## Architecture du projet

Le projet contient :

- API Gateway
- Orders Service
- Delivery Service
- Drivers Service
- Kafka
- Bases de données SQLite séparées

## Technologies utilisées

- Node.js
- Express.js
- gRPC
- Protocol Buffers
- GraphQL
- KafkaJS
- SQLite3
- Postman
- GitHub

## Structure du projet

```text
realtime-delivery-microservices/
│
├── api-gateway/
│   └── server.js
│
├── services/
│   ├── orders-service/
│   │   ├── server.js
│   │   ├── database/
│   │   └── kafka/
│   │
│   ├── delivery-service/
│   │   ├── server.js
│   │   ├── database/
│   │   └── kafka/
│   │
│   └── drivers-service/
│       ├── server.js
│       └── database/
│
├── proto/
│   ├── orders.proto
│   ├── delivery.proto
│   └── drivers.proto
│
└── docs/
    ├── kafka.md
    └── technical-documentation.md
```

## Microservices

### Orders Service

Responsable de la gestion des commandes.

Port gRPC :

```text
50051
```

### Delivery Service

Responsable de la gestion des livraisons.

Port gRPC :

```text
50052
```

### Drivers Service

Responsable de la gestion des livreurs.

Port gRPC :

```text
50053
```

## API Gateway

L'API Gateway est le point d'entrée principal de l'application.

Elle expose :

- REST
- GraphQL

Port :

```text
3000
```

## Endpoints REST

### Orders

```text
POST /orders
GET /orders
GET /orders/:id
PATCH /orders/:id/status
DELETE /orders/:id
```

### Deliveries

```text
POST /deliveries
GET /deliveries
GET /deliveries/:id
PATCH /deliveries/:id/status
DELETE /deliveries/:id
```

### Drivers

```text
POST /drivers
GET /drivers
GET /drivers/:id
PATCH /drivers/:id/availability
PATCH /drivers/:id/location
DELETE /drivers/:id
```

## GraphQL

L'endpoint GraphQL est disponible ici :

```text
http://localhost:3000/graphql
```

Exemple :

```graphql
{
  orders {
    id
    customer_name
    status
  }
}
```

## Kafka

Kafka est utilisé pour la communication asynchrone.

Topic utilisé :

```text
order.created
```

Producteur :

```text
Orders Service
```

Consommateur :

```text
Delivery Service
```

Kafka est désactivé par défaut pour permettre de lancer les services même si le broker Kafka n'est pas encore démarré.

Pour l'activer sous PowerShell :

```powershell
$env:KAFKA_ENABLED="true"
node server.js
```

## Bases de données

Chaque microservice possède sa propre base SQLite :

```text
Orders Service   -> orders.db
Delivery Service -> deliveries.db
Drivers Service  -> drivers.db
```

## Installation

Cloner le projet :

```bash
git clone https://github.com/Imenzaghouani19/realtime-delivery-microservices.git
cd realtime-delivery-microservices
```

Installer les dépendances de l'API Gateway :

```bash
cd api-gateway
npm install
```

Installer les dépendances des microservices :

```bash
cd ../services/orders-service
npm install

cd ../delivery-service
npm install

cd ../drivers-service
npm install
```

## Exécution

Il faut lancer chaque service dans un terminal séparé.

### Orders Service

```bash
cd services/orders-service
node server.js
```

### Delivery Service

```bash
cd services/delivery-service
node server.js
```

### Drivers Service

```bash
cd services/drivers-service
node server.js
```

### API Gateway

```bash
cd api-gateway
node server.js
```

Puis accéder à :

```text
http://localhost:3000
```

## Tests

Les routes REST ont été testées avec Postman.

Les dossiers Postman utilisés sont :

```text
Orders
Deliveries
Drivers
```

Chaque dossier contient les requêtes de création, consultation, modification et suppression.

## Documentation

La documentation technique se trouve dans :

```text
docs/technical-documentation.md
```

La documentation Kafka se trouve dans :

```text
docs/kafka.md
```