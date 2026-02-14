import { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { Client } from '../types';
import { normalizeText, getNextVisitDate } from '../utils/helpers';
import { ALL_DAYS } from '../constants/products';

interface UseClientsProps {
  userId: string;
  groupId?: string;
}

export const useClients = ({ userId, groupId }: UseClientsProps) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  // Real-time listener on clients collection
  useEffect(() => {
    if (!userId) return;

    const scopeField = groupId ? 'groupId' : 'userId';
    const scopeValue = groupId || userId;

    const unsubscribe = db
      .collection('clients')
      .where(scopeField, '==', scopeValue)
      .onSnapshot(
        (snapshot) => {
          const loadedClients: Client[] = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Client[];
          setClients(loadedClients);
          setLoading(false);
        },
        (error) => {
          console.error('Error loading clients:', error);
          setLoading(false);
        },
      );

    return () => unsubscribe();
  }, [userId, groupId]);

  // Get visible (non-completed) clients for a specific day
  const getVisibleClients = (day: string): Client[] => {
    if (!day) return [];
    return clients
      .filter((c) => {
        if (c.freq === 'on_demand') return false;
        if (c.isCompleted) return false;

        const matchesDay =
          (c.visitDays && c.visitDays.includes(day)) || c.visitDay === day;
        if (!matchesDay) return false;

        // Frequency-based filtering
        if (c.freq !== 'once' && c.freq !== 'weekly') {
          const nextVisit = getNextVisitDate(c, day);
          if (!nextVisit) return false;
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const visitDate = new Date(nextVisit);
          visitDate.setHours(0, 0, 0, 0);

          const dayIndex = ALL_DAYS.indexOf(day);
          const todayDayIndex = today.getDay() - 1; // 0=Mon in ALL_DAYS
          const isFutureDay = dayIndex > todayDayIndex;

          if (!isFutureDay && visitDate.getTime() > today.getTime()) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const orderA = a.listOrders?.[day] ?? a.listOrder ?? 0;
        const orderB = b.listOrders?.[day] ?? b.listOrder ?? 0;
        const cleanA = orderA > 100000 ? 0 : orderA;
        const cleanB = orderB > 100000 ? 0 : orderB;
        return cleanA - cleanB;
      });
  };

  // Get completed clients for a specific day (only 'once' freq)
  const getCompletedClients = (day: string): Client[] => {
    return clients.filter((c) => {
      if (!c.isCompleted) return false;
      return (c.visitDays && c.visitDays.includes(day)) || c.visitDay === day;
    });
  };

  // Get directory (all clients, searchable)
  const getFilteredDirectory = (searchTerm: string): Client[] => {
    return clients
      .filter((c) => {
        if (!searchTerm.trim()) return true;
        const term = normalizeText(searchTerm);
        const name = normalizeText(c.name || '');
        const address = normalizeText(c.address || '');
        const phone = (c.phone || '').toLowerCase();
        return name.includes(term) || address.includes(term) || phone.includes(term);
      })
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  };

  // --- MUTATION FUNCTIONS ---

  // Mark a client as done for the day
  const markAsDone = async (clientId: string, client: Client) => {
    try {
      if (client.freq === 'once') {
        // Once: mark as completed permanently
        await db.collection('clients').doc(clientId).update({
          isCompleted: true,
          completedAt: new Date(),
          updatedAt: new Date(),
          alarm: '',
          isStarred: false,
        });
      } else {
        // Periodic: update lastVisited to hide until next cycle
        const updates: Record<string, any> = {
          lastVisited: new Date(),
          alarm: '',
        };

        if (client.specificDate) {
          let interval = 1;
          if (client.freq === 'biweekly') interval = 2;
          if (client.freq === 'triweekly') interval = 3;
          if (client.freq === 'monthly') interval = 4;
          const currentSpecificDate = new Date(client.specificDate + 'T12:00:00');
          const nextSpecificDate = new Date(currentSpecificDate);
          nextSpecificDate.setDate(nextSpecificDate.getDate() + interval * 7);
          const tomorrow = new Date();
          tomorrow.setHours(0, 0, 0, 0);
          tomorrow.setDate(tomorrow.getDate() + 1);
          while (nextSpecificDate < tomorrow) {
            nextSpecificDate.setDate(nextSpecificDate.getDate() + interval * 7);
          }
          updates.specificDate = nextSpecificDate.toISOString().split('T')[0];
        }

        if (client.isStarred) {
          updates.isStarred = false;
        }

        await db.collection('clients').doc(clientId).update(updates);
      }
    } catch (e) {
      console.error('Error marking as done:', e);
    }
  };

  // Undo a completed client (only for 'once' freq)
  const undoComplete = async (clientId: string) => {
    try {
      await db.collection('clients').doc(clientId).update({
        isCompleted: false,
        completedAt: null,
        updatedAt: new Date(),
      });
    } catch (e) {
      console.error('Error undoing complete:', e);
    }
  };

  // Remove a client from the day's route (move to directory)
  const deleteFromDay = async (clientId: string) => {
    try {
      await db.collection('clients').doc(clientId).update({
        freq: 'on_demand',
        visitDay: 'Sin Asignar',
        visitDays: [],
      });
    } catch (e) {
      console.error('Error deleting from day:', e);
    }
  };

  // Generic update for client fields
  const updateClient = async (clientId: string, data: Partial<Client>) => {
    try {
      await db.collection('clients').doc(clientId).update(data);
    } catch (e) {
      console.error('Error updating client:', e);
    }
  };

  return {
    clients,
    loading,
    getVisibleClients,
    getCompletedClients,
    getFilteredDirectory,
    markAsDone,
    undoComplete,
    deleteFromDay,
    updateClient,
  };
};
