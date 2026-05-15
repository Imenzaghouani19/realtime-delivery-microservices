
# Documentation technique du projet

## 1. Introduction

Ce projet est une application de livraison en temps réel basée sur une architecture microservices.

L'idée principale est de séparer l'application en plusieurs petits services. Chaque service a son propre rôle et sa propre base de données.

Dans mon projet, j'ai choisi trois microservices :

- Orders Service
- Delivery Service
- Drivers Service

L'application contient aussi une API Gateway qui représente le point d'entrée principal pour le client.

## 2. Architecture du projet

L'architecture utilisée est basée sur une API Gateway et trois microservices.

Le client envoie les requêtes à l'API Gateway. Ensuite, l'API Gateway communique avec les microservices à travers gRPC.

Les microservices peuvent aussi échanger des événements avec Kafka.

Structure générale :

```text
Client
  |
API Gateway
  |
gRPC
  |
Microservices
```

Les microservices utilisés sont :

```text
Orders Service     : gestion des commandes
Delivery Service   : gestion des livraisons
Drivers Service    : gestion des livreurs
```

## 3. API Gateway

L'API Gateway est développée avec Node.js et Express.

Elle permet d'exposer :

- des routes REST ;
- un endpoint GraphQL.

Elle ne contient pas toute la logique métier. Elle appelle les microservices avec gRPC.

Port utilisé :

```text
3000
```

## 4. Orders Service

Ce service est responsable des commandes.

Il permet de :

- créer une commande ;
- afficher une commande ;
- afficher toutes les commandes ;
- modifier le statut d'une commande.

Il utilise une base de données SQLite séparée.

Port gRPC :

```text
50051
```

Base utilisée :

```text
orders.db
```

## 5. Delivery Service

Ce service est responsable des livraisons.

Il permet de :

- créer une livraison ;
- afficher une livraison ;
- afficher toutes les livraisons ;
- modifier le statut d'une livraison.

Il consomme aussi l'événement Kafka `order.created`.

Port gRPC :

```text
50052
```

Base utilisée :

```text
deliveries.db
```

## 6. Drivers Service

Ce service est responsable des livreurs.

Il permet de :

- ajouter un livreur ;
- afficher un livreur ;
- afficher tous les livreurs ;
- modifier la disponibilité ;
- modifier la position du livreur.

Port gRPC :

```text
50053
```

Base utilisée :

```text
drivers.db
```

## 7. gRPC

gRPC est utilisé entre l'API Gateway et les microservices.

Les fichiers `.proto` sont placés dans le dossier :

```text
proto/
```

Les fichiers créés sont :

```text
orders.proto
delivery.proto
drivers.proto
```

Chaque fichier contient les méthodes du service et les messages utilisés.

## 8. REST

Les routes REST sont exposées par l'API Gateway.

### Orders

```text
POST /orders
GET /orders
GET /orders/:id
PATCH /orders/:id/status
```

### Deliveries

```text
POST /deliveries
GET /deliveries
GET /deliveries/:id
PATCH /deliveries/:id/status
```

### Drivers

```text
POST /drivers
GET /drivers
GET /drivers/:id
PATCH /drivers/:id/availability
PATCH /drivers/:id/location
```

J'ai testé ces routes avec Postman.

## 9. GraphQL

GraphQL est aussi ajouté dans l'API Gateway.

L'endpoint utilisé est :

```text
http://localhost:3000/graphql
```

Exemple de requête GraphQL :

```graphql
{
  orders {
    id
    customer_name
    status
  }
}
```

Autre exemple :

```graphql
{
  drivers {
    id
    name
    available
    latitude
    longitude
  }
}
```

GraphQL permet de choisir seulement les champs nécessaires dans la réponse.

## 10. Kafka

Kafka est utilisé pour la communication asynchrone entre les services.

Dans ce projet, j'ai utilisé le topic :

```text
order.created
```

Quand une commande est créée, Orders Service publie un événement dans Kafka.

Delivery Service peut consommer cet événement pour être informé qu'une nouvelle commande doit être préparée pour la livraison.

Kafka est désactivé par défaut pour éviter les erreurs si le broker n'est pas encore lancé.

Pour l'activer sous Windows PowerShell :

```powershell
$env:KAFKA_ENABLED="true"
node server.js
```

Le détail Kafka est expliqué dans le fichier :

```text
docs/kafka.md
```

## 11. Bases de données

Chaque microservice a sa propre base SQLite.

```text
Orders Service   -> orders.db
Delivery Service -> deliveries.db
Drivers Service  -> drivers.db
```

Cela permet de garder les microservices indépendants.

## 12. Tests avec Postman

J'ai utilisé Postman pour tester les endpoints REST.

J'ai organisé les requêtes en plusieurs dossiers :

```text
Orders
Deliveries
Drivers
```

Chaque dossier contient les requêtes nécessaires pour tester les opérations principales.

Exemples :

```text
Create Order
Get All Orders
Get Order By ID
Update Order Status
```

```text
Create Delivery
Get All Deliveries
Get Delivery By ID
Update Delivery Status
```

```text
Create Driver
Get All Drivers
Get Driver By ID
Update Driver Availability
Update Driver Location
```

## 13. Instructions d'exécution

Pour exécuter le projet, il faut lancer chaque service dans un terminal séparé.

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

Ensuite, l'API Gateway est accessible sur :

```text
http://localhost:3000
```

GraphQL est accessible sur :

```text
http://localhost:3000/graphql
```

## 14. Organisation du travail avec GitHub

Le projet a été développé progressivement.

J'ai utilisé GitHub pour suivre les étapes du travail.

Les commits ont été séparés par fonctionnalité :

- création du repository ;
- ajout de la structure du projet ;
- ajout des fichiers `.proto` ;
- développement des microservices gRPC ;
- connexion de l'API Gateway avec les services ;
- ajout des bases SQLite ;
- ajout de GraphQL ;
- ajout de Kafka ;
- ajout de la documentation.

## 15. Conclusion

Ce projet m'a permis de comprendre comment organiser une application avec une architecture microservices.

J'ai utilisé Node.js, Express, gRPC, GraphQL, Kafka et SQLite pour créer une application de livraison en temps réel.

Le projet montre la séparation des responsabilités entre les services, la communication synchrone avec gRPC et la communication asynchrone avec Kafka.