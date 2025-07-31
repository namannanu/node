const express = require('express');
const {
    DynamoDBClient,
    GetItemCommand,
    PutItemCommand,
    QueryCommand
} = require('@aws-sdk/client-dynamodb');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');

const router = express.Router();
const ddb = new DynamoDBClient({ region: 'ap-south-1' });

router.post('/tickets', async (req, res) => {
    const { userId, eventId, expirationTime } = req.body;

    if (!userId || !eventId || !expirationTime) {
        return res.status(400).json({ success: false, msg: "Missing required fields" });
    }

    try {
        // Validate User exists
        const userResp = await ddb.send(new GetItemCommand({
            TableName: "Users",
            Key: { userId: { S: userId } }
        }));

        if (!userResp.Item || !userResp.Item.faceId) {
            return res.status(404).json({ success: false, msg: "User or FaceID not found" });
        }

        // Validate Event exists
        const eventResp = await ddb.send(new GetItemCommand({
            TableName: "Events",
            Key: { eventId: { S: eventId } }
        }));

        if (!eventResp.Item) {
            return res.status(404).json({ success: false, msg: "Event not found" });
        }

        // Check if user already has a ticket for this event
        const existingTicket = await ddb.send(new QueryCommand({
            TableName: "EventTickets",
            KeyConditionExpression: "userId = :uid",
            FilterExpression: "eventId = :eid",
            ExpressionAttributeValues: {
                ":uid": { S: userId },
                ":eid": { S: eventId }
            }
        }));

        if (existingTicket.Count && existingTicket.Count > 0) {
            return res.status(409).json({
                success: false,
                msg: "User already has a ticket for this event"
            });
        }

        const ticketId = uuidv4();
        const unixTime = /^\d+$/.test(expirationTime)
            ? parseInt(expirationTime)
            : moment(expirationTime, "YYYY-MM-DD HH:mm:ss").unix();

        // Save ticket to EventTickets table
        await ddb.send(new PutItemCommand({
            TableName: "EventTickets",
            Item: {
                userId: { S: userId },
                ticketId: { S: ticketId },
                eventId: { S: eventId },
                status: { S: "valid" },
                expirationTime: { N: unixTime.toString() }
            }
        }));

        // Register user to EventRegistrations table
        await ddb.send(new PutItemCommand({
            TableName: "EventRegistrations",
            Item: {
                eventId: { S: eventId },
                userId: { S: userId },
                registrationDate: { S: new Date().toISOString() }
            }
        }));

        res.json({ success: true, ticketId });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            msg: "Server error",
            error: err.message
        });
    }
});

module.exports = router;
