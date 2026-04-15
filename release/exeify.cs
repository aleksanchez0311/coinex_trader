using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace TraderLauncher
{
    static class Program
    {
        static Mutex mutex = new Mutex(true, "{TRADER_APP_UNIQUE_MUTEX_ID}");

        [STAThread]
        static void Main()
        {
            if (mutex.WaitOne(TimeSpan.Zero, true))
            {
                Application.EnableVisualStyles();
                Application.SetCompatibleTextRenderingDefault(false);
                Application.Run(new TraderApplicationContext());
                mutex.ReleaseMutex();
            }
            else
            {
                Process.Start(new ProcessStartInfo("http://localhost:4173") { UseShellExecute = true });
            }
        }
    }

    public class TraderApplicationContext : ApplicationContext
    {
        private NotifyIcon trayIcon;
        private LoadingForm loadingForm;
        private Process backendProcess;
        private Process frontendProcess;
        private string appDataDir;

        public TraderApplicationContext()
        {
            string baseDir = AppDomain.CurrentDomain.BaseDirectory;
            string exeDir = Path.GetDirectoryName(System.Reflection.Assembly.GetExecutingAssembly().Location) ?? baseDir;
            string iconPath = Path.Combine(exeDir, "favicon.ico");
            
            appDataDir = exeDir;
            
            trayIcon = new NotifyIcon()
            {
                Icon = File.Exists(iconPath) ? new Icon(iconPath) : SystemIcons.Application,
                ContextMenu = new ContextMenu(new MenuItem[] {
                    new MenuItem("Abrir en el Navegador", OpenBrowser),
                    new MenuItem("Recargar Proyecto", RefreshProject),
                    new MenuItem("Apagar y Salir", ExitApp)
                }),
                Visible = true,
                Text = "CoinEx Trader"
            };
            
            trayIcon.DoubleClick += OpenBrowser;

            loadingForm = new LoadingForm();
            loadingForm.Show();

            StartInitializationAsync();
        }

        private void StartInitializationAsync()
        {
            try
            {
                UpdateStatus("Dir: " + appDataDir);
                
                UpdateStatus("Descargando de GitHub...");
                CloneProject();
                UpdateStatus("Descarga completada.");

                InstallDependencies();

                UpdateStatus("Iniciando servidores...");
                StartServers();

                loadingForm.Invoke(new Action(() => {
                    loadingForm.Close();
                }));

                Process.Start(new ProcessStartInfo("http://localhost:4173") { UseShellExecute = true });
            }
            catch (Exception ex)
            {
                MessageBox.Show("Error al iniciar: " + ex.Message, "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private void CloneProject()
        {
            string iconPath = Path.Combine(appDataDir, "favicon.ico");
            string tempIcon = Path.Combine(Path.GetTempPath(), "trader_icon.ico");
            string appDir = Path.Combine(appDataDir, "app");
            
            if (File.Exists(iconPath))
            {
                File.Copy(iconPath, tempIcon, true);
            }
            
            if (!Directory.Exists(appDir))
            {
                UpdateStatus("Clonando repositorio...");
                ProcessStartInfo psi = new ProcessStartInfo();
                psi.FileName = "cmd.exe";
                psi.Arguments = "/c \"git clone https://github.com/aleksanchez0311/coinex_trader.git\"";
                psi.WorkingDirectory = appDataDir;
                psi.CreateNoWindow = true;
                psi.UseShellExecute = false;
                psi.RedirectStandardOutput = true;
                psi.RedirectStandardError = true;
                
                using (Process proc = Process.Start(psi))
                {
                    proc.WaitForExit();
                }
            }
            else
            {
                UpdateStatus("Actualizando con git pull...");
                ProcessStartInfo psi = new ProcessStartInfo();
                psi.FileName = "cmd.exe";
                psi.Arguments = "/c \"git pull\"";
                psi.WorkingDirectory = appDataDir;
                psi.CreateNoWindow = true;
                psi.UseShellExecute = false;
                psi.RedirectStandardOutput = true;
                psi.RedirectStandardError = true;
                
                using (Process proc = Process.Start(psi))
                {
                    proc.WaitForExit();
                }
            }
            
            if (File.Exists(tempIcon))
            {
                File.Copy(tempIcon, iconPath, true);
            }
            
            UpdateStatus("Verificando descarga...");
            if (!Directory.Exists(appDir))
            {
                throw new Exception("Descarga falló - carpeta app no encontrada");
            }
        }

        private void InstallDependencies()
        {
            string backendDir = Path.Combine(appDataDir, "app", "backend");
            string frontendDir = Path.Combine(appDataDir, "app", "frontend");

            if (!Directory.Exists(backendDir))
            {
                Directory.CreateDirectory(backendDir);
            }
            if (!Directory.Exists(frontendDir))
            {
                Directory.CreateDirectory(frontendDir);
            }

            if (File.Exists(Path.Combine(backendDir, "requirements.txt")) && !Directory.Exists(Path.Combine(backendDir, ".venv")))
            {
                UpdateStatus("Creando venv backend...");
                ProcessStartInfo psiBackend = new ProcessStartInfo();
                psiBackend.FileName = "cmd.exe";
                psiBackend.Arguments = "/c \"cd /d " + backendDir + " && python -m venv .venv\"";
                psiBackend.CreateNoWindow = true;
                psiBackend.UseShellExecute = false;
                using (Process proc = Process.Start(psiBackend))
                {
                    proc.WaitForExit();
                }

                UpdateStatus("Instalando dependencias Python...");
                ProcessStartInfo psiPip = new ProcessStartInfo();
                psiPip.FileName = "cmd.exe";
                psiPip.Arguments = "/c \"cd /d " + backendDir + " && .\\.venv\\Scripts\\pip.exe install -r requirements.txt\"";
                psiPip.CreateNoWindow = true;
                psiPip.UseShellExecute = false;
                using (Process proc = Process.Start(psiPip))
                {
                    proc.WaitForExit();
                }
            }

            if (File.Exists(Path.Combine(frontendDir, "package.json")) && !Directory.Exists(Path.Combine(frontendDir, "node_modules")))
            {
                UpdateStatus("Instalando dependencias Node.js...");
                ProcessStartInfo psiNpm = new ProcessStartInfo();
                psiNpm.FileName = "cmd.exe";
                psiNpm.Arguments = "/c \"cd /d " + frontendDir + " && npm install\"";
                psiNpm.CreateNoWindow = true;
                psiNpm.UseShellExecute = false;
                using (Process proc = Process.Start(psiNpm))
                {
                    proc.WaitForExit();
                }

                UpdateStatus("Compilando frontend...");
                ProcessStartInfo psiBuild = new ProcessStartInfo();
                psiBuild.FileName = "cmd.exe";
                psiBuild.Arguments = "/c \"cd /d " + frontendDir + " && npm run build\"";
                psiBuild.CreateNoWindow = true;
                psiBuild.UseShellExecute = false;
                using (Process proc = Process.Start(psiBuild))
                {
                    proc.WaitForExit();
                }
            }
        }

        private void StartServers()
        {
            string backendDir = Path.Combine(appDataDir, "app", "backend");
            string frontendDir = Path.Combine(appDataDir, "app", "frontend");

            ProcessStartInfo psiBackend = new ProcessStartInfo();
            psiBackend.FileName = "cmd.exe";
            psiBackend.Arguments = "/c \"cd /d \"" + backendDir + "\" && .\\.venv\\Scripts\\python.exe main.py\"";
            psiBackend.CreateNoWindow = true;
            psiBackend.UseShellExecute = false;
            backendProcess = Process.Start(psiBackend);

            ProcessStartInfo psiFrontend = new ProcessStartInfo();
            psiFrontend.FileName = "cmd.exe";
            psiFrontend.Arguments = "/c \"cd /d \"" + frontendDir + "\" && npm run preview\"";
            psiFrontend.CreateNoWindow = true;
            psiFrontend.UseShellExecute = false;
            frontendProcess = Process.Start(psiFrontend);
        }

        private void UpdateStatus(string message)
        {
            try {
                string logPath = Path.Combine(appDataDir, "trader.log");
                File.AppendAllText(logPath, DateTime.Now + ": " + message + Environment.NewLine);
            } catch { }
            
            loadingForm.Invoke(new Action(() => {
                loadingForm.UpdateStatus(message);
            }));
        }

        private void OpenBrowser(object sender, EventArgs e)
        {
            Process.Start(new ProcessStartInfo("http://localhost:5173") { UseShellExecute = true });
        }

        private void RefreshProject(object sender, EventArgs e)
        {
            try
            {
                if (backendProcess != null && !backendProcess.HasExited) backendProcess.Kill();
                if (frontendProcess != null && !frontendProcess.HasExited) frontendProcess.Kill();

                ProcessStartInfo psi = new ProcessStartInfo();
                psi.FileName = "git";
                psi.Arguments = "pull";
                psi.WorkingDirectory = appDataDir;
                psi.CreateNoWindow = true;
                psi.UseShellExecute = false;
                using (Process.Start(psi)) { }

                InstallDependencies();
                StartServers();
            }
            catch (Exception ex)
            {
                MessageBox.Show("Error al recargar: " + ex.Message, "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private void ExitApp(object sender, EventArgs e)
        {
            trayIcon.Visible = false;
            
            KillProcessTree(backendProcess != null ? backendProcess.Id : 0);
            KillProcessTree(frontendProcess != null ? frontendProcess.Id : 0);
            
            foreach (var proc in Process.GetProcesses())
            {
                try
                {
                    if (proc.ProcessName == "python" || proc.ProcessName == "python3" || 
                        proc.ProcessName == "node" || proc.ProcessName == "npm")
                    {
                        string cmdLine = "";
                        try { cmdLine = proc.MainModule.FileName; } catch { }
                        if (cmdLine.Contains("app\\backend") || cmdLine.Contains("app\\frontend"))
                        {
                            proc.Kill();
                        }
                    }
                }
                catch { }
            }

            Application.Exit();
        }
        
        private void KillProcessTree(int pid)
        {
            if (pid == 0) return;
            
            try
            {
                ProcessStartInfo psi = new ProcessStartInfo();
                psi.FileName = "cmd.exe";
                psi.Arguments = "/c \"taskkill /F /T /PID " + pid + "\"";
                psi.CreateNoWindow = true;
                psi.UseShellExecute = false;
                
                using (Process proc = Process.Start(psi))
                {
                    proc.WaitForExit();
                }
            }
            catch { }
        }
    }

    public class LoadingForm : Form
    {
        private Label statusLabel;
        private ProgressBar progressBar;

        public LoadingForm()
        {
            string iconPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "favicon.ico");
            this.Icon = File.Exists(iconPath) ? new Icon(iconPath) : SystemIcons.Application;
            
            this.Text = "CoinEx Trader";
            this.Size = new Size(400, 150);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.FormBorderStyle = FormBorderStyle.None;
            this.BackColor = Color.FromArgb(28, 30, 38);
            this.ShowInTaskbar = true;

            Label titleLabel = new Label();
            titleLabel.Text = "CoinEx Trader";
            titleLabel.ForeColor = Color.White;
            titleLabel.Font = new Font("Segoe UI", 14, FontStyle.Bold);
            titleLabel.AutoSize = true;
            titleLabel.Location = new Point(20, 20);
            this.Controls.Add(titleLabel);

            statusLabel = new Label();
            statusLabel.Text = "Iniciando...";
            statusLabel.ForeColor = Color.LightGray;
            statusLabel.Font = new Font("Segoe UI", 9, FontStyle.Regular);
            statusLabel.AutoSize = true;
            statusLabel.Location = new Point(20, 50);
            this.Controls.Add(statusLabel);

            progressBar = new ProgressBar();
            progressBar.Style = ProgressBarStyle.Marquee;
            progressBar.MarqueeAnimationSpeed = 30;
            progressBar.Location = new Point(20, 80);
            progressBar.Size = new Size(360, 20);
            this.Controls.Add(progressBar);
        }

        public void UpdateStatus(string message)
        {
            statusLabel.Text = message;
        }
    }
}