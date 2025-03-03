import mqtt from 'mqtt';
import { MQTTMessage } from '../types';

class MQTTClient {
  private client: mqtt.MqttClient | null = null;
  private messageCallbacks: ((message: MQTTMessage) => void)[] = [];
  private connectionCallbacks: ((connected: boolean) => void)[] = [];
  private isConnected: boolean = false;

  constructor() {}

  connect(brokerUrl: string, clientId: string, username?: string, password?: string): void {
    try {
      this.client = mqtt.connect(brokerUrl, {
        clientId,
        clean: true,
        connectTimeout: 4000,
        reconnectPeriod: 1000,
        username,
        password,
        rejectUnauthorized: false
      });

      this.client.on('connect', () => {
        console.log('Connected to MQTT broker');
        this.isConnected = true;
        this.notifyConnectionCallbacks(true);
      });

      this.client.on('error', (err) => {
        console.error('MQTT connection error:', err);
        this.isConnected = false;
        this.notifyConnectionCallbacks(false);
      });

      this.client.on('message', (topic, message) => {
        try {
          const parsedMessage = JSON.parse(message.toString());
          this.notifyMessageCallbacks({ topic, message: parsedMessage });
        } catch (error) {
          console.error('Error parsing MQTT message:', error);
        }
      });
    } catch (error) {
      console.error('Error connecting to MQTT broker:', error);
    }
  }

  subscribe(topic: string): void {
    if (this.client && this.isConnected) {
      this.client.subscribe(topic, (err) => {
        if (err) {
          console.error(`Error subscribing to ${topic}:`, err);
        } else {
          console.log(`Subscribed to ${topic}`);
        }
      });
    } else {
      console.warn('Cannot subscribe: MQTT client not connected');
    }
  }

  publish(topic: string, message: any): void {
    if (this.client && this.isConnected) {
      try {
        const messageString = JSON.stringify(message);
        this.client.publish(topic, messageString, { qos: 1 }, (err) => {
          if (err) {
            console.error(`Error publishing to ${topic}:`, err);
          }
        });
      } catch (error) {
        console.error('Error stringifying message:', error);
      }
    } else {
      console.warn('Cannot publish: MQTT client not connected');
    }
  }

  onMessage(callback: (message: MQTTMessage) => void): void {
    this.messageCallbacks.push(callback);
  }

  onConnectionChange(callback: (connected: boolean) => void): void {
    this.connectionCallbacks.push(callback);
    if (this.client) {
      callback(this.isConnected);
    }
  }

  private notifyMessageCallbacks(message: MQTTMessage): void {
    this.messageCallbacks.forEach(callback => callback(message));
  }

  private notifyConnectionCallbacks(connected: boolean): void {
    this.connectionCallbacks.forEach(callback => callback(connected));
  }

  disconnect(): void {
    if (this.client) {
      this.client.end();
      this.isConnected = false;
      this.notifyConnectionCallbacks(false);
    }
  }
}

const mqttClient = new MQTTClient();
export default mqttClient;