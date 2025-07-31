const express = require('express');
const router = express.Router();
const moment = require('moment');

const {
    DynamoDBClient,
    GetItemCommand,
    PutItemCommand,
    QueryCommand,
    UpdateItemCommand,
    CreateTableCommand
} = require('@aws-sdk/client-dynamodb');

const client = new DynamoDBClient({ region: "ap-south-1" });

router.use(express.json());

// ✅ Create Events Table
router.post('/create-table', async (req, res) => {
    const params = {
        TableName: "Events",
        AttributeDefinitions: [{ AttributeName: "eventId", AttributeType: "S" }],
        KeySchema: [{ AttributeName: "eventId", KeyType: "HASH" }],
        BillingMode: "PAY_PER_REQUEST",
    };

    try {
        const command = new CreateTableCommand(params);
        const result = await client.send(command);
        res.status(200).json({ message: "Table created successfully", result });
    } catch (err) {
        if (err.name === "ResourceInUseException") {
            res.status(200).json({ message: "Table already exists" });
        } else {
            res.status(500).json({ error: err.message });
        }
    }
});

// ✅ Insert New Event (No Duplicate EventId Allowed)
router.post('/insert-events', async (req, res) => {
    const { eventId, name, location, date, timeStart, timeEnd, totalTickets, price } = req.body;

    if (!eventId || !name || !location || !date || !timeStart || !timeEnd || !totalTickets || !price) {
        return res.status(400).json({ message: "Missing required fields" });
    }
    if (totalTickets < 0 || price < 0) {
        return res.status(400).json({ message: "Total tickets and price must be positive numbers" });
    }
    if (!moment(date, "YYYY-MM-DD", true).isValid()) {
        return res.status(400).json({ message: "Invalid date format. Please use YYYY-MM-DD." });
    }
    if (!moment(timeStart, "HH:mm", true).isValid() || !moment(timeEnd, "HH:mm", true).isValid()) {
        return res.status(400).json({ message: "Invalid time format. Please use HH:mm." });
    }
    if (moment(timeStart, "HH:mm").isAfter(moment(timeEnd, "HH:mm"))) {
        return res.status(400).json({ message: "Start time must be before end time." });
    }

    try {
        const existingEvent = await client.send(new GetItemCommand({
            TableName: "Events",
            Key: { eventId: { S: eventId } }
        }));

        if (existingEvent.Item) {
            return res.status(409).json({ message: "Event with this eventId already exists" });
        }

        const params = {
            TableName: "Events",
            Item: {
                "eventId": { S: eventId },
                "name": { S: name },
                "location": { S: location },
                "date": { S: date },
                "timeStart": { S: timeStart },
                "timeEnd": { S: timeEnd },
                "totalTickets": { N: totalTickets.toString() },
                "price": { N: price.toString() },
            }
        };

        await client.send(new PutItemCommand(params));
        res.status(200).json({ message: "Event inserted successfully" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// ✅ Update Existing Event
router.post('/inserted-event-update', async (req, res) => {
    const { eventId, name, location, date, timeStart, timeEnd, totalTickets, price } = req.body;

    if (!eventId) {
        return res.status(400).json({ message: "Event ID is required for update" });
    }

    if (!name || !location || !date || !timeStart || !timeEnd || !totalTickets || !price) {
        return res.status(400).json({ message: "Missing required fields for update" });
    }
    if (totalTickets < 0 || price < 0) {
        return res.status(400).json({ message: "Total tickets and price must be positive numbers" });
    }
    if (!moment(date, "YYYY-MM-DD", true).isValid()) {
        return res.status(400).json({ message: "Invalid date format. Please use YYYY-MM-DD." });
    }
    if (!moment(timeStart, "HH:mm", true).isValid() || !moment(timeEnd, "HH:mm", true).isValid()) {
        return res.status(400).json({ message: "Invalid time format. Please use HH:mm." });
    }
    if (moment(timeStart, "HH:mm").isAfter(moment(timeEnd, "HH:mm"))) {
        return res.status(400).json({ message: "Start time must be before end time." });
    }

    try {
        const existingEvent = await client.send(new GetItemCommand({
            TableName: "Events",
            Key: { eventId: { S: eventId } }
        }));

        if (!existingEvent.Item) {
            return res.status(404).json({ message: "Event not found" });
        }

        const params = {
            TableName: "Events",
            Key: { "eventId": { S: eventId } },
            UpdateExpression: "SET #n = :name, #loc = :location, #d = :date, timeStart = :timeStart, timeEnd = :timeEnd, totalTickets = :totalTickets, price = :price",
            ExpressionAttributeNames: {
                "#n": "name",
                "#d": "date",
                "#loc": "location"
            },
            ExpressionAttributeValues: {
                ":name": { S: name },
                ":location": { S: location },
                ":date": { S: date },
                ":timeStart": { S: timeStart },
                ":timeEnd": { S: timeEnd },
                ":totalTickets": { N: totalTickets.toString() },
                ":price": { N: price.toString() },
            }
        };

        await client.send(new UpdateItemCommand(params));
        res.status(200).json({ message: "Event updated successfully" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
