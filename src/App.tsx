import { VcfEditor } from "./components/vcf-editor";
import { PwaReloadPrompt } from "./components/pwa-reload-prompt";

function App() {
  return (
    <main className="h-screen bg-background">
      <PwaReloadPrompt />
      <VcfEditor />
    </main>
  );
}

export default App;
