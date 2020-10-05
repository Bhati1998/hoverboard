import data from '../../sessionize.json';
import { Answer, Question } from './types';

// TODO: Remove
export const notConfirmedSpeaker = (ids: string[]): boolean => {
  return ids.some((id) => {
    return [
      'fda81592-1959-4451-aaba-54e5eb15077c',
      '2073c65e-70f6-485b-8b96-560a0e2622a6',
    ].includes(id);
  });
};

export const nameToId = (name: string): string => {
  return name.toLowerCase().replace(/ /g, '_');
};

const findQuestion = (text: string): Question => {
  const question = data.questions.find(
    ({ question }) => question.trim().toLowerCase() === text.trim().toLowerCase()
  );

  if (question) {
    return question;
  } else {
    throw new Error(`Could not find Question with text ${text}`);
  }
};

export const questionAnswer = (question: string, answers: Answer[]): string => {
  const { id } = findQuestion(question);
  return answers.find(({ questionId }) => questionId === id)?.answerValue || '';
};

const findCategory = (text: string) => {
  const category = data.categories.find(({ title }) => {
    return title.trim().toLowerCase() === text.trim().toLowerCase();
  });

  if (category) {
    return category;
  } else {
    throw new Error(`Could not find Category with text ${text}`);
  }
};

export const categoryItem = (text: string, itemIds: number[]): string => {
  const { items } = findCategory(text);
  const item = items.find(({ id }) => itemIds.includes(id));
  return item?.name || '';
};
