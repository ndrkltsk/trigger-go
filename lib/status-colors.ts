interface StatusConfig {
  label: string;
  description: string;
  color: string;
  bgClass: string;
  textClass: string;
  icon: string;
  isTerminal: boolean;
  isActive: boolean;
}

export const RUN_STATUS_CONFIG: Record<string, StatusConfig> = {
  PENDING_VERSION: {
    label: 'Waiting for deploy',
    description: 'This job is waiting for the latest code to be deployed.',
    color: '#8B95A5',
    bgClass: 'bg-status-queued/25',
    textClass: 'text-status-queued',
    icon: 'clock',
    isTerminal: false,
    isActive: false,
  },
  QUEUED: {
    label: 'Queued',
    description: 'This job is waiting in line to run.',
    color: '#8B95A5',
    bgClass: 'bg-status-queued/25',
    textClass: 'text-status-queued',
    icon: 'clock',
    isTerminal: false,
    isActive: false,
  },
  EXECUTING: {
    label: 'Running',
    description: 'This job is running right now.',
    color: '#3B82F6',
    bgClass: 'bg-status-executing/15',
    textClass: 'text-status-executing',
    icon: 'loader',
    isTerminal: false,
    isActive: true,
  },
  REATTEMPTING: {
    label: 'Retrying',
    description: 'This job hit a problem and is trying again.',
    color: '#F59E0B',
    bgClass: 'bg-status-reattempting/15',
    textClass: 'text-status-reattempting',
    icon: 'refresh-cw',
    isTerminal: false,
    isActive: false,
  },
  FROZEN: {
    label: 'Waiting',
    description: 'This job is paused, waiting for something else to finish.',
    color: '#8B95A5',
    bgClass: 'bg-status-queued/25',
    textClass: 'text-status-queued',
    icon: 'pause',
    isTerminal: false,
    isActive: false,
  },
  COMPLETED: {
    label: 'Completed',
    description: 'This job finished successfully.',
    color: '#22C55E',
    bgClass: 'bg-status-success/15',
    textClass: 'text-status-success',
    icon: 'check-circle',
    isTerminal: true,
    isActive: false,
  },
  CANCELED: {
    label: 'Canceled',
    description: 'This job was stopped by a user.',
    color: '#8B95A5',
    bgClass: 'bg-status-canceled/25',
    textClass: 'text-status-canceled',
    icon: 'x-circle',
    isTerminal: true,
    isActive: false,
  },
  FAILED: {
    label: 'Failed',
    description: 'This job failed due to an error.',
    color: '#EF4444',
    bgClass: 'bg-status-failed/15',
    textClass: 'text-status-failed',
    icon: 'x-octagon',
    isTerminal: true,
    isActive: false,
  },
  CRASHED: {
    label: 'Crashed',
    description: 'This job crashed unexpectedly.',
    color: '#EF4444',
    bgClass: 'bg-status-failed/15',
    textClass: 'text-status-failed',
    icon: 'alert-triangle',
    isTerminal: true,
    isActive: false,
  },
  INTERRUPTED: {
    label: 'Interrupted',
    description: 'This job was interrupted.',
    color: '#8B95A5',
    bgClass: 'bg-status-canceled/25',
    textClass: 'text-status-canceled',
    icon: 'slash',
    isTerminal: true,
    isActive: false,
  },
  SYSTEM_FAILURE: {
    label: 'System Error',
    description: 'An internal system error occurred.',
    color: '#EF4444',
    bgClass: 'bg-status-failed/15',
    textClass: 'text-status-failed',
    icon: 'server-crash',
    isTerminal: true,
    isActive: false,
  },
  DELAYED: {
    label: 'Delayed',
    description: 'This job is scheduled to start later.',
    color: '#8B95A5',
    bgClass: 'bg-status-queued/25',
    textClass: 'text-status-queued',
    icon: 'clock',
    isTerminal: false,
    isActive: false,
  },
  EXPIRED: {
    label: 'Expired',
    description: 'This job expired before it could run.',
    color: '#8B95A5',
    bgClass: 'bg-status-canceled/25',
    textClass: 'text-status-canceled',
    icon: 'timer-off',
    isTerminal: true,
    isActive: false,
  },
  TIMED_OUT: {
    label: 'Timed Out',
    description: 'This job ran for too long and was stopped.',
    color: '#EF4444',
    bgClass: 'bg-status-failed/15',
    textClass: 'text-status-failed',
    icon: 'timer-off',
    isTerminal: true,
    isActive: false,
  },
};

export const DEPLOYMENT_STATUS_CONFIG: Record<string, StatusConfig> = {
  PENDING: {
    label: 'Pending',
    description: 'Deployment is waiting to start.',
    color: '#8B95A5',
    bgClass: 'bg-status-queued/25',
    textClass: 'text-status-queued',
    icon: 'clock',
    isTerminal: false,
    isActive: false,
  },
  INSTALLING: {
    label: 'Installing',
    description: 'Installing dependencies.',
    color: '#3B82F6',
    bgClass: 'bg-status-executing/15',
    textClass: 'text-status-executing',
    icon: 'loader',
    isTerminal: false,
    isActive: true,
  },
  BUILDING: {
    label: 'Building',
    description: 'Building the deployment.',
    color: '#3B82F6',
    bgClass: 'bg-status-executing/15',
    textClass: 'text-status-executing',
    icon: 'loader',
    isTerminal: false,
    isActive: true,
  },
  DEPLOYING: {
    label: 'Deploying',
    description: 'Deployment is being rolled out.',
    color: '#3B82F6',
    bgClass: 'bg-status-executing/15',
    textClass: 'text-status-executing',
    icon: 'loader',
    isTerminal: false,
    isActive: true,
  },
  DEPLOYED: {
    label: 'Deployed',
    description: 'Deployment completed successfully.',
    color: '#22C55E',
    bgClass: 'bg-status-success/15',
    textClass: 'text-status-success',
    icon: 'check-circle',
    isTerminal: true,
    isActive: false,
  },
  FAILED: {
    label: 'Failed',
    description: 'Deployment failed.',
    color: '#EF4444',
    bgClass: 'bg-status-failed/15',
    textClass: 'text-status-failed',
    icon: 'x-octagon',
    isTerminal: true,
    isActive: false,
  },
  CANCELED: {
    label: 'Canceled',
    description: 'Deployment was canceled.',
    color: '#8B95A5',
    bgClass: 'bg-status-canceled/25',
    textClass: 'text-status-canceled',
    icon: 'x-circle',
    isTerminal: true,
    isActive: false,
  },
  TIMED_OUT: {
    label: 'Timed Out',
    description: 'Deployment took too long and was stopped.',
    color: '#EF4444',
    bgClass: 'bg-status-failed/15',
    textClass: 'text-status-failed',
    icon: 'timer-off',
    isTerminal: true,
    isActive: false,
  },
};

export function getDeploymentStatusConfig(status: string): StatusConfig {
  return (
    DEPLOYMENT_STATUS_CONFIG[status] ?? {
      label: status,
      description: 'Unknown status.',
      color: '#8B95A5',
      bgClass: 'bg-status-canceled/25',
      textClass: 'text-status-canceled',
      icon: 'help-circle',
      isTerminal: false,
      isActive: false,
    }
  );
}

export function getStatusConfig(status: string): StatusConfig {
  return (
    RUN_STATUS_CONFIG[status] ?? {
      label: status,
      description: 'Unknown status.',
      color: '#8B95A5',
      bgClass: 'bg-status-canceled/25',
      textClass: 'text-status-canceled',
      icon: 'help-circle',
      isTerminal: false,
      isActive: false,
    }
  );
}

export function isTerminalStatus(status: string): boolean {
  return getStatusConfig(status).isTerminal;
}
