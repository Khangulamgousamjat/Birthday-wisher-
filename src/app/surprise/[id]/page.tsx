import { getSurpriseData } from '@/lib/db';
import { notFound } from 'next/navigation';
import { ExperienceClient } from './ExperienceClient';

export default async function SurprisePage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const data = await getSurpriseData(params.id);
  
  if (!data) {
    notFound();
  }
  
  return <ExperienceClient data={data} />;
}
