export default function PrivacyPage() {
  return (
    <main className="max-w-3xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>

      <p className="mb-4">
        We do <strong>not</strong> collect any personal information from visitors to this website.
      </p>

      <p className="mb-4">
        However, this site uses <a href="https://www.google.com/adsense" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">Google AdSense</a> to display ads. Google may collect information through cookies to personalize ads based on your browsing activity. For more information, please visit&nbsp;
        <a href="https://policies.google.com/privacy" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">
          Google’s Privacy Policy
        </a>.
      </p>

      <p className="mb-4">
        If you enter a name or other information in your profile (for example, your “profile_name”), please be aware that this data is visible within the game and stored in our database. Avoid entering any sensitive or personally identifiable information, as it is your own responsibility to keep your data safe.
      </p>

      <p className="mb-4">
        By using this website, you agree to these terms.
      </p>
    </main>
  );
}
