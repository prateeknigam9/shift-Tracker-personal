import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import Header from "@/components/header";
import Footer from "@/components/footer";
import TabsNavigation from "@/components/tabs-navigation";
import ShiftsTab from "@/pages/shifts-tab";
import PayTab from "@/pages/pay-tab";
import NotesTab from "@/pages/notes-tab";
import ProfileTab from "@/pages/profile-tab";
import AnalyticsTab from "@/pages/analytics-tab";
import WellnessTab from "@/pages/wellness-tab";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<string>("shifts");
  const { user } = useAuth();
  
  if (!user) return null;
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header user={user} />
      
      <main className="flex-1 container mx-auto px-4 py-6">
        <TabsNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
        
        <div className="tab-content mt-6">
          {activeTab === "shifts" && <ShiftsTab />}
          {activeTab === "pay" && <PayTab />}
          {activeTab === "notes" && <NotesTab />}
          {activeTab === "analytics" && <AnalyticsTab />}
          {activeTab === "wellness" && <WellnessTab />}
          {activeTab === "profile" && <ProfileTab />}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
