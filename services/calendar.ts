import * as Calendar from 'expo-calendar';
import * as Google from 'expo-auth-session/providers/google';
import { Platform } from 'react-native';
import { Task } from '../store/tasks';

// Google Calendar API scopes
const GOOGLE_CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
];

interface CalendarEvent {
  id: string;
  calendarId: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  provider: 'google' | 'apple';
}

export class CalendarService {
  private static instance: CalendarService;
  private calendars: { [key: string]: any } = {};
  private eventMap: { [taskId: string]: CalendarEvent } = {};

  private constructor() {}

  static getInstance(): CalendarService {
    if (!CalendarService.instance) {
      CalendarService.instance = new CalendarService();
    }
    return CalendarService.instance;
  }

  // Request calendar permissions
  async requestCalendarPermissions(): Promise<boolean> {
    try {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting calendar permissions:', error);
      return false;
    }
  }

  // Initialize Google Calendar
  async initializeGoogleCalendar() {
    try {
      const [request, response, promptAsync] = Google.useAuthRequest({
        clientId: process.env.GOOGLE_CLIENT_ID,
        scopes: GOOGLE_CALENDAR_SCOPES,
      });

      if (response?.type === 'success') {
        const { authentication } = response;
        // Store the access token for later use
        this.calendars['google'] = {
          accessToken: authentication.accessToken,
          expiresIn: authentication.expiresIn,
        };
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error initializing Google Calendar:', error);
      return false;
    }
  }

  // Initialize Apple Calendar
  async initializeAppleCalendar() {
    try {
      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      const defaultCalendar = calendars.find(calendar => calendar.allowsModifications);
      
      if (defaultCalendar) {
        this.calendars['apple'] = defaultCalendar;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error initializing Apple Calendar:', error);
      return false;
    }
  }

  // Create calendar event from task
  private async createCalendarEvent(task: Task, provider: 'google' | 'apple'): Promise<CalendarEvent | null> {
    try {
      const dueDate = new Date(task.dueDate);
      const startDate = new Date(dueDate);
      startDate.setHours(9, 0, 0, 0); // Default to 9 AM
      const endDate = new Date(startDate);
      endDate.setHours(10, 0, 0, 0); // 1-hour duration by default

      const eventDetails = {
        title: task.title,
        description: `${task.description}\n\nPriority: ${task.priority}\nCategory: ${task.category}`,
        startDate,
        endDate,
        allDay: false,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };

      if (provider === 'google') {
        // Create Google Calendar event
        const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.calendars['google'].accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            summary: eventDetails.title,
            description: eventDetails.description,
            start: { dateTime: eventDetails.startDate.toISOString() },
            end: { dateTime: eventDetails.endDate.toISOString() },
            timeZone: eventDetails.timeZone,
          }),
        });

        const data = await response.json();
        return {
          id: data.id,
          calendarId: 'primary',
          ...eventDetails,
          provider,
        };
      } else {
        // Create Apple Calendar event
        const eventId = await Calendar.createEventAsync(this.calendars['apple'].id, {
          title: eventDetails.title,
          notes: eventDetails.description,
          startDate: eventDetails.startDate,
          endDate: eventDetails.endDate,
          timeZone: eventDetails.timeZone,
          alarms: [{ relativeOffset: -30 }], // 30-minute reminder
        });

        return {
          id: eventId,
          calendarId: this.calendars['apple'].id,
          ...eventDetails,
          provider,
        };
      }
    } catch (error) {
      console.error('Error creating calendar event:', error);
      return null;
    }
  }

  // Update calendar event from task
  private async updateCalendarEvent(task: Task, event: CalendarEvent): Promise<boolean> {
    try {
      const dueDate = new Date(task.dueDate);
      const startDate = new Date(dueDate);
      startDate.setHours(9, 0, 0, 0);
      const endDate = new Date(startDate);
      endDate.setHours(10, 0, 0, 0);

      const eventDetails = {
        title: task.title,
        description: `${task.description}\n\nPriority: ${task.priority}\nCategory: ${task.category}`,
        startDate,
        endDate,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };

      if (event.provider === 'google') {
        // Update Google Calendar event
        await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${event.id}`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${this.calendars['google'].accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            summary: eventDetails.title,
            description: eventDetails.description,
            start: { dateTime: eventDetails.startDate.toISOString() },
            end: { dateTime: eventDetails.endDate.toISOString() },
            timeZone: eventDetails.timeZone,
          }),
        });
      } else {
        // Update Apple Calendar event
        await Calendar.updateEventAsync(event.id, {
          title: eventDetails.title,
          notes: eventDetails.description,
          startDate: eventDetails.startDate,
          endDate: eventDetails.endDate,
          timeZone: eventDetails.timeZone,
        });
      }

      return true;
    } catch (error) {
      console.error('Error updating calendar event:', error);
      return false;
    }
  }

  // Delete calendar event
  private async deleteCalendarEvent(event: CalendarEvent): Promise<boolean> {
    try {
      if (event.provider === 'google') {
        // Delete Google Calendar event
        await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${event.id}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${this.calendars['google'].accessToken}`,
          },
        });
      } else {
        // Delete Apple Calendar event
        await Calendar.deleteEventAsync(event.id);
      }

      return true;
    } catch (error) {
      console.error('Error deleting calendar event:', error);
      return false;
    }
  }

  // Sync task with calendar
  async syncTaskWithCalendar(task: Task): Promise<boolean> {
    try {
      const provider = Platform.OS === 'ios' ? 'apple' : 'google';
      const existingEvent = this.eventMap[task._id];

      if (task.completed) {
        // Delete event if task is completed
        if (existingEvent) {
          await this.deleteCalendarEvent(existingEvent);
          delete this.eventMap[task._id];
        }
        return true;
      }

      if (existingEvent) {
        // Update existing event
        return await this.updateCalendarEvent(task, existingEvent);
      } else {
        // Create new event
        const event = await this.createCalendarEvent(task, provider);
        if (event) {
          this.eventMap[task._id] = event;
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Error syncing task with calendar:', error);
      return false;
    }
  }

  // Initialize calendar sync
  async initializeCalendarSync(): Promise<boolean> {
    try {
      const hasPermission = await this.requestCalendarPermissions();
      if (!hasPermission) return false;

      if (Platform.OS === 'ios') {
        return await this.initializeAppleCalendar();
      } else {
        return await this.initializeGoogleCalendar();
      }
    } catch (error) {
      console.error('Error initializing calendar sync:', error);
      return false;
    }
  }
} 