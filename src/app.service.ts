import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AppService {
  getHello(): string {
    return `
      Invoice Management API! ${new Date().toISOString()} </br>
      Version: ${this.getVersion()}`;
  }
  getVersion(): string {
    try {
      // Resolve the path to the package.json file
      const packageJsonPath = path.resolve(__dirname, '../package.json');

      // Read the package.json file
      const packageJson = fs.readFileSync(packageJsonPath, 'utf-8');

      // Parse the JSON and return the version
      const parsedJson = JSON.parse(packageJson);
      return parsedJson.version || 'Version not found';
    } catch (error) {
      // Handle errors (e.g., file not found or invalid JSON)
      console.error('Error reading package.json:', error);
      return 'Error retrieving version';
    }
  }
}
