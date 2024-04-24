import { Metadata } from 'next';

import Container from '@/components/ui/container';

export const metadata: Metadata = {
  title: "Brainshare - Components",
  description: "List of components",
};

export default function ComponentList() {
  return <Container>Component list</Container>;
}
