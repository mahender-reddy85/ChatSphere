import React from 'react';
import { IconCheck, IconDoubleCheck } from './Icons';

interface StatusBadgeProps {
  status: 'sending' | 'sent' | 'delivered' | 'seen';
  timestamp?: number;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, timestamp }) => {
  const formatTime = (ts: number) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    }).format(ts);
  };

  const renderIcon = () => {
    switch (status) {
      case 'sending':
        return (
          <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
        );
      case 'sent':
        return <IconCheck className="w-3 h-3 text-gray-400" />;
      case 'delivered':
        return <IconDoubleCheck className="w-3 h-3 text-gray-400" />;
      case 'seen':
        return <IconDoubleCheck className="w-3 h-3 text-blue-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
      {renderIcon()}
      {status === 'seen' && timestamp && <span>{formatTime(timestamp)}</span>}
    </div>
  );
};

export default StatusBadge;
