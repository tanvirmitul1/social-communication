/**
 * Application Entry Point
 *
 * This is the main entry file that bootstraps the application
 */

import 'reflect-metadata';
import 'express-async-errors';
import { startServer } from '@application/server.js';

// Start the server
startServer();
