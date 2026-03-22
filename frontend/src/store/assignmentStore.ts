import { create } from 'zustand';
import { Assignment, GeneratedPaper, JobStatus, WSMessage } from '@/types';

interface AssignmentState {
  assignments: Assignment[];
  currentAssignment: Assignment | null;
  generationStatus: JobStatus | null;
  generationProgress: number;
  generationMessage: string;
  wsConnected: boolean;
  wsRef: WebSocket | null;

  setAssignments: (assignments: Assignment[]) => void;
  addAssignment: (assignment: Assignment) => void;
  setCurrentAssignment: (assignment: Assignment | null) => void;
  updateAssignmentStatus: (id: string, status: JobStatus, paper?: GeneratedPaper) => void;
  setGenerationStatus: (status: JobStatus | null) => void;
  setGenerationProgress: (progress: number) => void;
  setGenerationMessage: (message: string) => void;
  setWsConnected: (connected: boolean) => void;
  setWsRef: (ws: WebSocket | null) => void;
  handleWSMessage: (message: WSMessage) => void;
}

export const useAssignmentStore = create<AssignmentState>((set, get) => ({
  assignments: [],
  currentAssignment: null,
  generationStatus: null,
  generationProgress: 0,
  generationMessage: '',
  wsConnected: false,
  wsRef: null,

  setAssignments: (assignments) => set({ assignments }),

  addAssignment: (assignment) =>
    set((state) => ({ assignments: [assignment, ...state.assignments] })),

  setCurrentAssignment: (assignment) => set({ currentAssignment: assignment }),

  updateAssignmentStatus: (id, status, paper) =>
    set((state) => ({
      assignments: state.assignments.map((a) =>
        a._id === id ? { ...a, jobStatus: status, generatedPaper: paper ?? a.generatedPaper } : a
      ),
      currentAssignment:
        state.currentAssignment?._id === id
          ? {
              ...state.currentAssignment,
              jobStatus: status,
              generatedPaper: paper ?? state.currentAssignment.generatedPaper,
            }
          : state.currentAssignment,
    })),

  setGenerationStatus: (status) => set({ generationStatus: status }),
  setGenerationProgress: (progress) => set({ generationProgress: progress }),
  setGenerationMessage: (message) => set({ generationMessage: message }),
  setWsConnected: (connected) => set({ wsConnected: connected }),
  setWsRef: (ws) => set({ wsRef: ws }),

  handleWSMessage: (message: WSMessage) => {
    const {
      setGenerationStatus,
      setGenerationProgress,
      setGenerationMessage,
      updateAssignmentStatus,
    } = get();

    switch (message.type) {
      case 'job_queued':
        setGenerationStatus('pending');
        setGenerationProgress(0);
        setGenerationMessage(message.message || 'Queued...');
        break;
      case 'job_processing':
        setGenerationStatus('processing');
        setGenerationProgress(5);
        setGenerationMessage(message.message || 'Processing...');
        break;
      case 'progress':
        setGenerationStatus('processing');
        setGenerationProgress(message.progress ?? 50);
        setGenerationMessage(message.message || 'Generating...');
        break;
      case 'job_completed':
        setGenerationStatus('completed');
        setGenerationProgress(100);
        setGenerationMessage(message.message || 'Done!');
        updateAssignmentStatus(message.assignmentId, 'completed', message.payload);
        break;
      case 'job_failed':
        setGenerationStatus('failed');
        setGenerationMessage(message.message || 'Generation failed.');
        updateAssignmentStatus(message.assignmentId, 'failed');
        break;
    }
  },
}));
