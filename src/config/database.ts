import { Prisma, PrismaClient } from "@prisma/client";
import { logger } from "../utils/logger";

class Database {
    private static instance: PrismaClient;

    public static getInstance(): PrismaClient {
        if(!Database.instance){
            Database.instance = new PrismaClient({
                log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
            });

            Database.instance.$connect()
            .then(() => {
                logger.info('Connected to the database');
            })
            .catch((error: Error) => {
                logger.error('Error connecting to the database', error);
                process.exit(1);
       
            });
        }
        return Database.instance;
    }

    public static async disconnect(): Promise<void> {
        if(Database.instance){
            await Database.instance.$disconnect();
            logger.info('Disconnected from the database');
        }
    }
}

export default Database;