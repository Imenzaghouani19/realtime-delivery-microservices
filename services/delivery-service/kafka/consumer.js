const { Kafka } = require("kafkajs");

const kafka = new Kafka({
    clientId: "delivery-service",
    brokers: ["localhost:9092"],
});

const consumer = kafka.consumer({
    groupId: "delivery-service-group",
});

async function startOrderCreatedConsumer() {
    try {
        await consumer.connect();
        await consumer.subscribe({
            topic: "order.created",
            fromBeginning: true,
        });

        console.log("Delivery Kafka consumer subscribed to order.created");

        await consumer.run({
            eachMessage: async ({ topic, message }) => {
                const event = JSON.parse(message.value.toString());

                console.log("Kafka event received in Delivery Service");
                console.log("Topic:", topic);
                console.log("Event:", event.event);
                console.log("Order data:", event.data);
            },
        });
    } catch (error) {
        console.error("Error starting Kafka consumer:", error.message);
    }
}

module.exports = {
    startOrderCreatedConsumer,
};