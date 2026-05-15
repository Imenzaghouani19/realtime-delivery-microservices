# Schéma d'architecture

## Architecture générale

Le projet utilise une architecture microservices avec une API Gateway.

Le client ne communique pas directement avec les microservices.  
Il passe toujours par l'API Gateway.

```text
Client / Postman / GraphQL UI
              |
              | REST / GraphQL
              |
        API Gateway
              |
              | gRPC
              |
 ------------------------------------------------
 |                    |                         |
Orders Service   Delivery Service        Drivers Service
 |                    |                         |
SQLite DB          SQLite DB                SQLite DB
```

## Communication entre les composants

### 1. Client vers API Gateway

Le client utilise :

```text
REST
GraphQL
```

L'API Gateway expose les routes REST et l'endpoint GraphQL.

### 2. API Gateway vers microservices

L'API Gateway communique avec les microservices avec gRPC.

```text
API Gateway  --->  Orders Service
API Gateway  --->  Delivery Service
API Gateway  --->  Drivers Service
```

Les contrats gRPC sont définis dans le dossier :

```text
proto/
```

### 3. Communication Kafka

Kafka est utilisé pour la communication asynchrone.

```text
Orders Service  --->  Kafka topic: order.created  --->  Delivery Service
```

Quand une commande est créée, Orders Service publie un événement `order.created`.

Delivery Service peut consommer cet événement pour préparer une livraison.

## Ports utilisés

| Composant | Port |
|---|---|
| API Gateway | 3000 |
| Orders Service | 50051 |
| Delivery Service | 50052 |
| Drivers Service | 50053 |
| Kafka Broker | 9092 |

## Bases de données

Chaque microservice possède sa propre base SQLite.

```text
Orders Service   -> orders.db
Delivery Service -> deliveries.db
Drivers Service  -> drivers.db
```

## Résumé

Cette architecture permet de séparer les responsabilités :

- Orders Service gère les commandes ;
- Delivery Service gère les livraisons ;
- Drivers Service gère les livreurs ;
- API Gateway centralise l'accès client ;
- Kafka permet la communication asynchrone.