import { TaskProvider } from '@/hooks/useTaskStore';
import { LeftSidebar } from '@/components/LeftSidebar';
import { ContentArea } from '@/components/ContentArea';
import { RightPanel } from '@/components/RightPanel';

const Index = () => {
  return (
    <TaskProvider>
      <div className="flex h-screen w-full overflow-hidden">
        <LeftSidebar />
        <ContentArea />
        <RightPanel />
      </div>
    </TaskProvider>
  );
};

export default Index;
