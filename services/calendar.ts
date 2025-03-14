import * as Calendar from 'expo-calendar';
import { Platform } from 'react-native';
import { Task } from '../store/tasks';

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

  // Initialize Google Calendar - simplified version
  async initializeGoogleCalendar() {
    console.log('Google Calendar integration is disabled for now');
    return false;
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

  // Create calendar event from task - simplified
  private async createCalendarEvent(task: Task, provider: 'google' | 'apple'): Promise<CalendarEvent | null> {
    try {
      if (!this.calendars[provider]) {
        console.error(`${provider} calendar not initialized`);
        return null;
      }

      const dueDate = new Date(task.deadline);
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

      if (provider === 'apple' && this.calendars['apple']) {
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
      
      return null;
    } catch (error) {
      console.error('Error creating calendar event:', error);
      return null;
    }
  }

  // Sync task with calendar - simplified
  async syncTaskWithCalendar(task: Task): Promise<boolean> {
    try {
      // Only support Apple Calendar for now
      if (Platform.OS !== 'ios') {
        return false;
      }
      
      const provider = 'apple';
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

  // Update calendar event from task - simplified
  private async updateCalendarEvent(task: Task, event: CalendarEvent): Promise<boolean> {
    try {
      if (!task.calendarEventId || !this.calendars['apple']) {
        return false;
      }

      const dueDate = new Date(task.deadline);
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

      if (event.provider === 'apple') {
        // Update Apple Calendar event
        await Calendar.updateEventAsync(event.id, {
          title: eventDetails.title,
          notes: eventDetails.description,
          startDate: eventDetails.startDate,
          endDate: eventDetails.endDate,
          timeZone: eventDetails.timeZone,
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error updating calendar event:', error);
      return false;
    }
  }

  // Delete calendar event
  private async deleteCalendarEvent(event: CalendarEvent): Promise<boolean> {
    try {
      if (event.provider === 'apple') {
        // Delete Apple Calendar event
        await Calendar.deleteEventAsync(event.id);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting calendar event:', error);
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
        console.log('Calendar sync is only supported on iOS for now');
        return false;
      }
    } catch (error) {
      console.error('Error initializing calendar sync:', error);
      return false;
    }
  }
} 