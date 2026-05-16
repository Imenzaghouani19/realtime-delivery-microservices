# Kafka Documentation

## Objectif

Kafka est utilisé pour assurer une communication asynchrone entre les microservices.

Dans ce projet, Kafka permet de découpler le service des commandes du service des livraisons.

## Broker Kafka

Le broker Kafka est supposé être lancé sur :

```text
localhost:9092
```

## Topics utilisés

| Topic | Producteur | Consommateur | Description |
|---|---|---|---|
| order.created | Orders Service | Delivery Service | Événement publié lorsqu'une nouvelle commande est créée |

## Scénario métier

Lorsqu'un client crée une commande via l'API Gateway, la requête est envoyée à Orders Service via gRPC.

Orders Service enregistre la commande dans sa base SQLite, puis publie un événement Kafka sur le topic `order.created`.

Delivery Service consomme cet événement afin d'être informé qu'une nouvelle commande doit être préparée pour une livraison.

## Message échangé

Exemple de message publié sur le topic `order.created` :

```json
{
  "event": "order.created",
  "data": {
    "id": 1,
    "customer_name": "Imen",
    "customer_phone": "12345678",
    "pickup_address": "Tunis Centre",
    "delivery_address": "Ariana",
    "status": "CREATED"
  },
  "createdAt": "2026-05-15T14:00:00.000Z"
}
```

## Activation de Kafka

Par défaut, Kafka est désactivé pour permettre de lancer les microservices même si le broker Kafka n'est pas encore démarré.

Pour activer Kafka, il faut lancer les services avec la variable d'environnement :

```bash
KAFKA_ENABLED=true
```

Sous Windows PowerShell :

```bash
$env:KAFKA_ENABLED="true"
node server.js
```

## Test réalisé

Kafka a été testé localement avec le broker lancé sur `localhost:9092`.

Après la création d'une commande avec l'endpoint REST `POST /orders`, Orders Service publie l'événement `order.created`.

Delivery Service reçoit ensuite l'événement dans son terminal.

Exemple observé :

```text
Kafka event received in Delivery Service
Topic: order.created
Event: order.created
Order data: {
  id: 3,
  customer_name: 'Imen',
  customer_phone: '12345678',
  pickup_address: 'Tunis Centre',
  delivery_address: 'Ariana',
  status: 'CREATED'
}