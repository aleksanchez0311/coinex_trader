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
                Process.Start(new ProcessStartInfo("http://localhost:5173") { UseShellExecute = true });
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

            Task.Run(() => StartInitializationAsync());
        }

        private async Task StartInitializationAsync()
        {
            try
            {
                UpdateStatus("Dir: " + appDataDir);
                
                if (!Directory.Exists(Path.Combine(appDataDir, "app")))
                {
                    UpdateStatus("Descargando de GitHub...");
                    CloneProject();
                    UpdateStatus("Esperando descarga...");
                    await Task.Delay(5000);
                }

                UpdateStatus("Instalando dependencias...");
                InstallDependencies();
                await Task.Delay(3000);

                UpdateStatus("Iniciando servidores...");
                StartServers();

                await Task.Delay(3000);

                loadingForm.Invoke(new Action(() => {
                    loadingForm.Close();
                }));

                Process.Start(new ProcessStartInfo("http://localhost:5173") { UseShellExecute = true });
            }
            catch (Exception ex)
            {
                MessageBox.Show("Error al iniciar: " + ex.Message, "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private void CloneProject()
        {
            Directory.CreateDirectory(appDataDir);
            
            ProcessStartInfo psi = new ProcessStartInfo();
            psi.FileName = "git";
            psi.Arguments = "clone https://github.com/aleksanchez0311/coinex_trader.git .";
            psi.WorkingDirectory = appDataDir;
            psi.CreateNoWindow = true;
            psi.UseShellExecute = false;
            
            using (Process proc = Process.Start(psi))
            {
                proc.WaitForExit();
            }
        }

        private void InstallDependencies()
        {
            string backendDir = Path.Combine(appDataDir, "app", "backend");
            string webDir = Path.Combine(appDataDir, "app", "web");

            if (!Directory.Exists(backendDir))
            {
                Directory.CreateDirectory(backendDir);
            }
            if (!Directory.Exists(webDir))
            {
                Directory.CreateDirectory(webDir);
            }

            if (File.Exists(Path.Combine(backendDir, "requirements.txt")) && !Directory.Exists(Path.Combine(backendDir, ".venv")))
            {
                ProcessStartInfo psiBackend = new ProcessStartInfo();
                psiBackend.FileName = "cmd.exe";
                psiBackend.Arguments = "/c \"cd /d " + backendDir + " && python -m venv .venv && .\\.venv\\Scripts\\pip.exe install -r requirements.txt\"";
                psiBackend.CreateNoWindow = true;
                psiBackend.UseShellExecute = false;
                using (Process.Start(psiBackend)) { }
            }

            if (File.Exists(Path.Combine(webDir, "package.json")) && !Directory.Exists(Path.Combine(webDir, "node_modules")))
            {
                ProcessStartInfo psiNpm = new ProcessStartInfo();
                psiNpm.FileName = "cmd.exe";
                psiNpm.Arguments = "/c \"cd /d " + webDir + " && npm install && npm run build\"";
                psiNpm.CreateNoWindow = true;
                psiNpm.UseShellExecute = false;
                using (Process.Start(psiNpm)) { }
            }
        }

        private void StartServers()
        {
            string backendDir = Path.Combine(appDataDir, "app", "backend");
            string webDir = Path.Combine(appDataDir, "app", "web");

            if (!Directory.Exists(backendDir) || !File.Exists(Path.Combine(backendDir, "main.py")))
            {
                UpdateStatus("Esperando a que se clone el proyecto...");
                System.Threading.Thread.Sleep(5000);
            }

            ProcessStartInfo psiBackend = new ProcessStartInfo();
            psiBackend.FileName = "cmd.exe";
            psiBackend.Arguments = "/k \"cd /d \"" + backendDir + "\" && .\\.venv\\Scripts\\python.exe main.py\"";
            psiBackend.CreateNoWindow = false;
            psiBackend.UseShellExecute = false;
            backendProcess = Process.Start(psiBackend);

            ProcessStartInfo psiFrontend = new ProcessStartInfo();
            psiFrontend.FileName = "cmd.exe";
            psiFrontend.Arguments = "/k \"cd /d \"" + webDir + "\" && npm run dev\"";
            psiFrontend.CreateNoWindow = false;
            psiFrontend.UseShellExecute = false;
            frontendProcess = Process.Start(psiFrontend);
        }

        private void UpdateStatus(string message)
        {
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

            if (backendProcess != null && !backendProcess.HasExited)
            {
                backendProcess.Kill();
            }
            if (frontendProcess != null && !frontendProcess.HasExited)
            {
                frontendProcess.Kill();
            }

            Application.Exit();
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