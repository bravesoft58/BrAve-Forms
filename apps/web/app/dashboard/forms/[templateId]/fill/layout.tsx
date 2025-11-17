import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Fill Form | BrAve Forms',
  description: 'Fill out construction compliance form',
};

export default function FormFillLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
