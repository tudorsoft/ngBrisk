//main.server.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { AppServerModule } from './app/app.server.module'; 
import { config } from './app/app.config.server';

const bootstrap = () => bootstrapApplication(AppServerModule, config); 

export { bootstrap };