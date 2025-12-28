import express from 'express';
import { registration, login, generateTicket, fetchTicketRecords } from '../controller/controller.js';

const router = express.Router();

router.post("/angular/v1/api/registration", registration);
router.post("/angular/v1/api/signin", login);
router.post("/angular/v1/api/generateTicket", generateTicket);
router.get("/angular/v1/api/fetchTicketRecords", fetchTicketRecords);


export default router;
