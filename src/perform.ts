import createDebug from 'debug';
import { Request, Response } from 'express';
import {
  InputValidationError,
  Provider,
  UnexpectedError,
} from '@superfaceai/one-sdk';
import { validate, IsDefined } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { DEBUG_PREFIX } from './constants';
import { getInstance as getOneSdk } from './oneSdk';

const debug = createDebug(`${DEBUG_PREFIX}:perform`);

export class PerformParams {
  @IsDefined()
  profile!: string;

  @IsDefined()
  useCase!: string;

  provider?: string;

  @IsDefined()
  input!: Record<string, any>;
}

export async function performRoute(req: Request, res: Response) {
  const performParams = plainToClass(PerformParams, req.body);
  debug('Perform params', performParams);

  const validationErrors = await validate(performParams);
  debug('Perform params errors', validationErrors);

  if (validationErrors.length > 0) {
    res.status(400).json({
      title: 'Invalid request',
      detail: validationErrors.map((e) => e.toString()).join(' '),
    });
    return;
  }

  try {
    const result = await perform(performParams);
    debug('Perform result', result);

    const response = result.unwrap();
    debug('Perform response', response);

    res.json(response);
  } catch (err) {
    debug('ERROR', err);

    if (err instanceof InputValidationError) {
      res.status(400).json({
        title: err.kind,
        detail: err.message,
      });
    } else if (err instanceof UnexpectedError) {
      res.status(500).json({
        title: err.kind,
        detail: err.message,
      });
    } else if (err instanceof Error) {
      res.status(500).json({
        title: err.name,
        detail: err.message,
      });
    } else {
      res.status(500).json({
        title: 'Internal server error',
      });
    }
  }
}

export async function perform(params: PerformParams) {
  const oneSdk = getOneSdk();

  const profile = await oneSdk.getProfile(params.profile);
  const useCase = profile.getUseCase(params.useCase); // Why this doesn't throw if getProfile does?
  let provider!: Provider;

  if (params.provider) {
    provider = await oneSdk.getProvider(params.provider);
  }

  return await useCase.perform(params.input, { provider });
}
