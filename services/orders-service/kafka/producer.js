const { Kafka } = require("kafkajs");

const kafka = new Kafka({
    clientId: "orders-service",
    brokers: ["localhost:9092"],
});

const producer = kafka.producer();

async function connectProducer() {
    try {
        await producer.connect();
        console.log("Orders Kafka producer connected");
    } catch (error) {
        console.error("Error connecting Kafka producer:", error.message);
    }
}

async function publishOrderCreated(order) {
    try {
        await producer.send({
            topic: "order.created",
            messages: [
                {
                    value: JSON.stringify({
                        event: "order.created",
                        data: order,
                        createdAt: new Date().toISOString(),
                    }),
                },
            ],
        });

        console.log("Kafka event published: order.created");
    } catch (error) {
        console.error("Error publishing order.created event:", error.message);
    }
}

module.exports = {
    connectProducer,
    publishOrderCreated,
};