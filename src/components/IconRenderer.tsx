import React from 'react';
import {
  Footprints,
  Dumbbell,
  WineOff,
  CigaretteOff,
  Flame,
  Calendar,
  DollarSign,
  TrendingUp,
  Settings,
  Plus,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Award,
  LucideProps,
} from 'lucide-react';

interface IconRendererProps extends LucideProps {
  name: string;
}

export const IconRenderer: React.FC<IconRendererProps> = ({ name, ...props }) => {
  switch (name) {
    case 'Footprints':
      return <Footprints {...props} />;
    case 'Dumbbell':
      return <Dumbbell {...props} />;
    case 'WineOff':
      return <WineOff {...props} />;
    case 'CigaretteOff':
      return <CigaretteOff {...props} />;
    case 'Flame':
      return <Flame {...props} />;
    case 'Calendar':
      return <Calendar {...props} />;
    case 'DollarSign':
      return <DollarSign {...props} />;
    case 'TrendingUp':
      return <TrendingUp {...props} />;
    case 'Settings':
      return <Settings {...props} />;
    case 'Plus':
      return <Plus {...props} />;
    case 'CheckCircle2':
      return <CheckCircle2 {...props} />;
    case 'AlertTriangle':
      return <AlertTriangle {...props} />;
    case 'RotateCcw':
      return <RotateCcw {...props} />;
    case 'Sparkles':
      return <Sparkles {...props} />;
    case 'Award':
      return <Award {...props} />;
    default:
      return <Sparkles {...props} />;
  }
};
