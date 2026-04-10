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
                // First instance
                Application.EnableVisualStyles();
                Application.SetCompatibleTextRenderingDefault(false);
                Application.Run(new TraderApplicationContext());
                mutex.ReleaseMutex();
            }
            else
            {
                // Already running, just open the browser
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

        public TraderApplicationContext()
        {
            string baseDir = AppDomain.CurrentDomain.BaseDirectory;
            string iconPath = Path.Combine(baseDir, "favicon.ico");
            string exeDir = Path.GetDirectoryName(System.Reflection.Assembly.GetExecutingAssembly().Location) ?? baseDir;
            if (!File.Exists(iconPath))
                iconPath = Path.Combine(exeDir, "favicon.ico");
            
            trayIcon = new NotifyIcon()
            {
                Icon = File.Exists(iconPath) 
                    ? new Icon(iconPath)
                    : SystemIcons.Application,
                ContextMenu = new ContextMenu(new MenuItem[] {
                    new MenuItem("Abrir en el Navegador", OpenBrowser),
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
                string baseDir = AppDomain.CurrentDomain.BaseDirectory;
                string projectDir = Path.GetFullPath(Path.Combine(baseDir, ".."));

                string backendDir = Path.Combine(projectDir, "backend");
                string webDir = Path.Combine(projectDir, "web");

                // Step 1: Run Setup Bat (installs requirements, builds)
                ProcessStartInfo psiSetup = new ProcessStartInfo();
                psiSetup.FileName = "cmd.exe";
                psiSetup.Arguments = "/c \"setup_and_run.bat\"";
                psiSetup.CreateNoWindow = true;
                psiSetup.UseShellExecute = false;
                psiSetup.WorkingDirectory = projectDir;

                using (Process procSetup = Process.Start(psiSetup))
                {
                    procSetup.WaitForExit();
                }

                // Step 2: Start Backend
                ProcessStartInfo psiBackend = new ProcessStartInfo();
                psiBackend.FileName = "cmd.exe";
                psiBackend.Arguments = "/c \"call .venv\\Scripts\\activate.bat && python main.py\"";
                psiBackend.CreateNoWindow = true;
                psiBackend.UseShellExecute = false;
                psiBackend.WorkingDirectory = backendDir;
                backendProcess = Process.Start(psiBackend);

                // Step 3: Start Frontend
                ProcessStartInfo psiFrontend = new ProcessStartInfo();
                psiFrontend.FileName = "cmd.exe";
                psiFrontend.Arguments = "/c \"npm run preview --host\"";
                psiFrontend.CreateNoWindow = true;
                psiFrontend.UseShellExecute = false;
                psiFrontend.WorkingDirectory = webDir;
                frontendProcess = Process.Start(psiFrontend);

                await Task.Delay(3000); // Wait for servers to be ready

                loadingForm.Invoke(new Action(() => {
                    loadingForm.Close();
                }));

                // Open Browser
                Process.Start(new ProcessStartInfo("http://localhost:4173") { UseShellExecute = true });
            }
            catch (Exception ex)
            {
                MessageBox.Show("Error al iniciar el sistema: " + ex.Message, "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private void OpenBrowser(object sender, EventArgs e)
        {
            Process.Start(new ProcessStartInfo("http://localhost:4173") { UseShellExecute = true });
        }

        private void ExitApp(object sender, EventArgs e)
        {
            trayIcon.Visible = false;

            if (backendProcess != null && !backendProcess.HasExited)
            {
                KillProcessTree(backendProcess.Id);
            }
            if (frontendProcess != null && !frontendProcess.HasExited)
            {
                KillProcessTree(frontendProcess.Id);
            }

            Application.Exit();
        }

        private void KillProcessTree(int pid)
        {
            try
            {
                ProcessStartInfo psi = new ProcessStartInfo();
                psi.FileName = "taskkill";
                psi.Arguments = string.Format("/T /F /PID {0}", pid);
                psi.CreateNoWindow = true;
                psi.UseShellExecute = false;
                Process.Start(psi).WaitForExit();
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
            
            this.Text = "Trader Launcher";
            this.Size = new Size(400, 150);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.FormBorderStyle = FormBorderStyle.None;
            this.BackColor = Color.FromArgb(28, 30, 38);
            this.ShowInTaskbar = true;

            Label titleLabel = new Label();
            titleLabel.Text = "Coinex Trader";
            titleLabel.ForeColor = Color.White;
            titleLabel.Font = new Font("Segoe UI", 14, FontStyle.Bold);
            titleLabel.AutoSize = true;
            titleLabel.Location = new Point(20, 20);
            this.Controls.Add(titleLabel);

            statusLabel = new Label();
            statusLabel.Text = "Configurando e iniciando servidores, espere por favor...";
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
    }
}
