import React, { useState, useEffect } from 'react';
import { IconX, IconPlus, IconTrash } from './Icons';

interface CreatePollModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreatePoll: (poll: { question: string; options: string[], location?: string }) => void;
}

const CreatePollModal: React.FC<CreatePollModalProps> = ({ isOpen, onClose, onCreatePoll }) => {
    const [question, setQuestion] = useState('');
    const [options, setOptions] = useState(['', '']);

    useEffect(() => {
        if (isOpen) {
            setQuestion('');
            setOptions(['', '']);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleOptionChange = (index: number, value: string) => {
        const newOptions = [...options];
        newOptions[index] = value;
        setOptions(newOptions);
    };

    const addOption = () => {
        if (options.length < 5) {
            setOptions([...options, '']);
        }
    };

    const removeOption = (index: number) => {
        if (options.length > 2) {
            const newOptions = options.filter((_, i) => i !== index);
            setOptions(newOptions);
        }
    };

    const handleCreatePoll = () => {
        const validOptions = options.map(o => o.trim()).filter(Boolean);
        if (question.trim() && validOptions.length >= 2) {
            onCreatePoll({
                question: question.trim(),
                options: validOptions,
            });
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                    <h2 className="text-lg font-semibold dark:text-white">Create a Poll</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                        <IconX className="w-5 h-5 text-gray-600 dark:text-gray-300"/>
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Question</label>
                        <input type="text" value={question} onChange={e => setQuestion(e.target.value)} placeholder="What should we do for lunch?" className="w-full mt-1 px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                    </div>
                    {/* Location field removed as requested */}
                    <div>
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Options</label>
                        <div className="space-y-2 mt-1">
                            {options.map((option, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <input type="text" value={option} onChange={e => handleOptionChange(index, e.target.value)} placeholder={`Option ${index + 1}`} className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                                    {options.length > 2 && (
                                        <button onClick={() => removeOption(index)} className="p-2 text-gray-500 hover:text-red-500 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600">
                                            <IconTrash className="w-5 h-5"/>
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                     <button onClick={addOption} disabled={options.length >= 5} className="flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 hover:underline disabled:opacity-50">
                        <IconPlus className="w-4 h-4" /> Add Option
                    </button>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t dark:border-gray-700 flex justify-end">
                     <button 
                        onClick={handleCreatePoll} 
                        disabled={!question.trim() || options.filter(o => o.trim()).length < 2}
                        className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:bg-primary-300 dark:disabled:bg-primary-800"
                    >
                        Create Poll
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreatePollModal;