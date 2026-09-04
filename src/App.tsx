import { VcfEditor } from "./components/vcf-editor";
import { PwaInstallDialog } from "./components/pwa-install-dialog";
import { PwaReloadPrompt } from "./components/pwa-reload-prompt";

function App() {
  return (
    <main className="h-screen bg-background">
      <PwaReloadPrompt />
      <PwaInstallDialog />
      <VcfEditor />
    </main>
  );
}

export default App;
