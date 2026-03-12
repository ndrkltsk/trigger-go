import { http, HttpResponse } from 'msw';
import { API_BASE_URL } from '@/lib/constants';

const BASE_URL = API_BASE_URL;

export const handlers = [
  // Runs list
  http.get(`${BASE_URL}/api/v1/runs`, () => {
    return HttpResponse.json({
      data: [],
      pagination: { next: null, previous: null },
    });
  }),
];
