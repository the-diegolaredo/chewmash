import { migrateLegacyWebState, webStateRepository } from '../../../../src/storage/web';

export const stateRepository = webStateRepository;
export const loadInitialState = migrateLegacyWebState;
