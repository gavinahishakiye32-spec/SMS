import { useQuery } from '@tanstack/react-query';
import API from './api';

export function useActiveYear() {
  const { data: activeYear } = useQuery({
    queryKey: ['active-academic-year'],
    queryFn: () => API.get('/academic-years/active').then((r) => r.data.data),
    retry: false,
  });

  const { data: activeTerm } = useQuery({
    queryKey: ['active-term'],
    queryFn: () => API.get('/terms/active').then((r) => r.data.data),
    retry: false,
    enabled: !!activeYear,
  });

  const { data: allAcademicYears } = useQuery({
    queryKey: ['academic-years'],
    queryFn: () => API.get('/academic-years').then((r) => r.data.data),
  });

  const { data: allTerms } = useQuery({
    queryKey: ['terms'],
    queryFn: () => API.get('/terms').then((r) => r.data.data),
  });

  return {
    activeYear,
    activeTerm,
    allAcademicYears,
    allTerms,
    defaultAcademicYearId: activeYear?._id || '',
    defaultTermId: activeTerm?._id || '',
  };
}
