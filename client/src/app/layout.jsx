import './globals.css';

export const metadata = {
  title: 'StudyTube AI — YouTube Playlist Study Assistant',
  description: 'Ask questions about any YouTube playlist and get AI-powered answers with exact video timestamps. Powered by Groq LLM and vector search.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🎓</text></svg>" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
