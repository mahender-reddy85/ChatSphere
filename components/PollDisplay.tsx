import React, { useMemo } from 'react';
import type { Poll, User } from '../types';
import { IconMapPin } from './Icons';

interface PollDisplayProps {
    poll: Poll;
    currentUser: User;
    onVote: (optionId: string) => void;
    isCurrentUserMessage: boolean;
}

const PollDisplay: React.FC<PollDisplayProps> = ({ poll, currentUser, onVote, isCurrentUserMessage }) => {
    const totalVotes = useMemo(() => poll.options.reduce((sum, opt) => sum + opt.votes.length, 0), [poll.options]);
    const userVote = useMemo(() => poll.options.find(opt => opt.votes.includes(currentUser.id)), [poll.options, currentUser.id]);

    const textColor = isCurrentUserMessage ? 'text-white' : 'text-gray-800 dark:text-gray-200';

    return (
        <div className={`my-2 w-full max-w-sm sm:w-80 md:w-96 lg:w-[32rem] ${textColor}`}>
            <p className="font-bold mb-1 text-sm sm:text-base">{poll.question}</p>
            {poll.location && (
                <div className="flex items-center gap-1.5 text-xs mb-3 opacity-80">
                    <IconMapPin className="w-3.5 h-3.5" />
                    <span>{poll.location}</span>
                </div>
            )}
            <div className="space-y-2">
                {poll.options.map(option => {
                    const percentage = totalVotes > 0 ? (option.votes.length / totalVotes) * 100 : 0;
                    const isVotedByUser = option.id === userVote?.id;

                    const baseBorder = isCurrentUserMessage ? 'border-white/50' : 'border-gray-300 dark:border-gray-600';
                    const hoverBorder = isCurrentUserMessage ? 'hover:border-white/80' : 'hover:border-primary-500 dark:hover:border-primary-400';
                    const votedRing = isCurrentUserMessage ? 'ring-white/80' : 'ring-primary-500';
                    const progressBg = isCurrentUserMessage ? 'bg-white/25' : 'bg-primary-100 dark:bg-primary-900/50';
                    const optionTextColor = isCurrentUserMessage ? 'text-white' : 'text-gray-800 dark:text-gray-100';
                    const voteCountColor = isCurrentUserMessage ? 'text-white/90' : 'text-gray-600 dark:text-gray-300';

                    return (
                        <div key={option.id} className="relative">
                            <button
                                onClick={() => onVote(option.id)}
                                className={`w-full text-left p-3 sm:p-2 border rounded-md transition-all duration-200 min-h-[44px] mobile-touch-friendly
                                    ${isVotedByUser ? `ring-2 ${votedRing}` : baseBorder}
                                    ${hoverBorder}`
                                }
                            >
                                {userVote && (
                                    <div
                                        className={`absolute top-0 left-0 h-full ${progressBg} rounded-md`}
                                        style={{ width: `${percentage}%` }}
                                    />
                                )}
                                <div className="relative z-10 flex justify-between items-center">
                                    <span className={`font-medium text-sm sm:text-base ${optionTextColor}`}>{option.text}</span>
                                    {userVote && (
                                        <span className={`text-xs sm:text-sm font-semibold ${voteCountColor}`}>{option.votes.length} ({Math.round(percentage)}%)</span>
                                    )}
                                </div>
                            </button>
                        </div>
                    );
                })}
            </div>
            <p className={`text-xs text-right mt-2 ${isCurrentUserMessage ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>
                {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
            </p>
        </div>
    );
};

export default PollDisplay;