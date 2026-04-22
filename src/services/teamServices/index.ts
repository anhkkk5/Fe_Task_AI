import axiosInstance from "../../utils/axios/request";

export type TeamRole = "owner" | "admin" | "member" | "viewer";
export type TeamType = "student" | "company";

export interface TeamMember {
  userId: string;
  email: string;
  name: string;
  avatar?: string;
  role: TeamRole;
  /** Vị trí công việc, tham chiếu catalog (vd: "backend") */
  position?: string;
  /** Level năng lực, tham chiếu catalog (vd: "intern", "middle") */
  level?: string;
  joinedAt: string;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  teamType: TeamType;
  industry?: string;
  members: TeamMember[];
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TeamInvite {
  _id: string;
  teamId: string;
  email: string;
  role: TeamRole;
  status: string;
  expiresAt: string;
}

export interface MemberWorkload {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  totalEstimatedMinutes: number;
  scheduledMinutes: number;
}

export interface TeamTaskCreatePayload {
  title: string;
  status: "todo" | "in_progress" | "completed" | "cancelled";
  assigneeId: string;
  startAt?: string;
  deadline?: string;
}

// Team CRUD
export const listTeams = () =>
  axiosInstance.get<Team[]>("/teams").then((r) => r.data);
export const getTeam = (id: string) =>
  axiosInstance.get<Team>(`/teams/${id}`).then((r) => r.data);
export const createTeam = (data: {
  name: string;
  description?: string;
  teamType?: TeamType;
  industry?: string;
}) => axiosInstance.post<Team>("/teams", data).then((r) => r.data);
export const updateTeam = (
  id: string,
  data: {
    name?: string;
    description?: string;
    teamType?: TeamType;
    industry?: string;
  },
) => axiosInstance.put<Team>(`/teams/${id}`, data).then((r) => r.data);
export const deleteTeam = (id: string) =>
  axiosInstance.delete(`/teams/${id}`).then((r) => r.data);

// Members
export const removeMember = (teamId: string, memberId: string) =>
  axiosInstance
    .delete<Team>(`/teams/${teamId}/members/${memberId}`)
    .then((r) => r.data);
export const updateMemberRole = (
  teamId: string,
  memberId: string,
  role: TeamRole,
) =>
  axiosInstance
    .patch<Team>(`/teams/${teamId}/members/${memberId}/role`, { role })
    .then((r) => r.data);
export const updateMemberProfile = (
  teamId: string,
  memberId: string,
  data: { position?: string | null; level?: string | null },
) =>
  axiosInstance
    .patch<Team>(`/teams/${teamId}/members/${memberId}/profile`, data)
    .then((r) => r.data);
export const getMemberWorkload = (teamId: string, memberId: string) =>
  axiosInstance
    .get<MemberWorkload>(`/teams/${teamId}/members/${memberId}/workload`)
    .then((r) => r.data);

// Invites
export const inviteMember = (teamId: string, email: string, role: TeamRole) =>
  axiosInstance
    .post(`/teams/${teamId}/invite`, { email, role })
    .then((r) => r.data);
export const listPendingInvites = (teamId: string) =>
  axiosInstance
    .get<TeamInvite[]>(`/teams/${teamId}/invites`)
    .then((r) => r.data);
export const revokeInvite = (teamId: string, inviteId: string) =>
  axiosInstance
    .delete(`/teams/${teamId}/invites/${inviteId}`)
    .then((r) => r.data);
export const getInviteInfo = (token: string) =>
  axiosInstance.get(`/teams/invite/info?token=${token}`).then((r) => r.data);
export const acceptInvite = (token: string) =>
  axiosInstance.post(`/teams/invite/accept`, { token }).then((r) => r.data);
export const declineInvite = (token: string) =>
  axiosInstance.post(`/teams/invite/decline`, { token }).then((r) => r.data);

// Tasks
export const getTeamTasks = (
  teamId: string,
  filters?: {
    status?: string;
    assigneeId?: string;
    priority?: string;
    reporterId?: string;
    keyword?: string;
    startFrom?: string;
    startTo?: string;
    deadlineFrom?: string;
    deadlineTo?: string;
  },
) =>
  axiosInstance
    .get(`/teams/${teamId}/tasks`, { params: filters })
    .then((r) => r.data);
export const createTeamTask = (teamId: string, data: TeamTaskCreatePayload) =>
  axiosInstance.post(`/teams/${teamId}/tasks`, data).then((r) => r.data);
export const getTeamBoard = (teamId: string) =>
  axiosInstance.get(`/teams/${teamId}/board`).then((r) => r.data);
export const assignTask = (
  teamId: string,
  taskId: string,
  assigneeId: string,
) =>
  axiosInstance
    .post(`/teams/${teamId}/tasks/${taskId}/assign`, { assigneeId })
    .then((r) => r.data);
export const unassignTask = (teamId: string, taskId: string) =>
  axiosInstance
    .delete(`/teams/${teamId}/tasks/${taskId}/assign`)
    .then((r) => r.data);

// Calendar
export const getTeamCalendar = (teamId: string, from: string, to: string) =>
  axiosInstance
    .get(`/teams/${teamId}/calendar`, { params: { from, to } })
    .then((r) => r.data);
export const detectConflicts = (teamId: string, from: string, to: string) =>
  axiosInstance
    .get(`/teams/${teamId}/conflicts`, { params: { from, to } })
    .then((r) => r.data);

// User lookup by email (for invite preview)
export const lookupUserByEmail = (email: string) =>
  axiosInstance
    .get(`/users/search/by-email`, { params: { email } })
    .then((r) => r.data);
