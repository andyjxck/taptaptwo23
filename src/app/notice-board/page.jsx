"use client";
import React from "react";

const seasonBackgrounds = {
  Spring: "from-[#c084fc] via-[#a78bfa] to-[#7c3aed]", // deep pastel purple
  // ...other seasons
};

function MainComponent() {
  React.useEffect(() => {
    // Get userId from localStorage
    const userId = localStorage.getItem("userId");

    // Record pageview
    fetch("/api/record-pageview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        page_path: "/notice-board",
        user_id: userId || null,
        user_agent: navigator.userAgent,
        referrer: document.referrer,
      }),
    }).catch(console.error);
  }, []); // Run once on mount

  const currentSeason = "Spring";

  const notes = [
    {
      id: 8,
      title: "Dev Log #8 - 15/07/25",
      content: (
        <div
          style={{
            fontFamily:
              "'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            lineHeight: 1.7,
            color: "#2d3748",
            fontSize: "1.05rem",
            letterSpacing: "0.02em",
          }}
        >
          <p
            style={{
              fontStyle: "italic",
              color: "#666666",
              fontSize: "0.97rem",
              marginBottom: "1.5rem",
              maxWidth: "90%",
              lineHeight: 1.6,
            }}
          >
            Hi everyone! This dev log marks the largest single expansion in the
            history of TapTapTwo. Nearly every system in the game has seen new
            content, features, polish, or critical backend improvements. We've
            been at it non-stop for the last couple of days—read on for every
            detail!
          </p>

          <h2
            style={{
              fontFamily: "'Crimson Text', serif",
              fontWeight: 700,
              fontSize: "2.2rem",
              color: "#7c3aed",
              letterSpacing: "0.05em",
              margin: 0,
              marginBottom: "2rem",
              textAlign: "left",
            }}
          >
            The{" "}
            <span style={{ color: "#7c3aed", fontWeight: 700 }}>
              Unlock Everything
            </span>{" "}
            Update
          </h2>

          <h3 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>
            New Domain, New Era
          </h3>
          <ul style={{ paddingLeft: "1.25rem", marginBottom: "1.5rem" }}>
            <li>
              <b>TapTapTwo has moved to its own custom domain!</b> We're finally
              off our previous host and now running the game on a dedicated web
              address, providing faster load times, much better stability, and
              total control over site features, ads, and analytics.
            </li>
            <li>
              No more broken links or platform limitations—this is a huge step
              up that makes proper promotions, SEO, and special integrations
              possible for the first time.
            </li>
            <li>
              This migration took a lot of late nights but it sets up TapTapTwo
              for serious future growth. Thank you for sticking with us during
              the transition.
            </li>
          </ul>

          <h3 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>
            Promo & Gift Code System Launch
          </h3>
          <ul style={{ paddingLeft: "1.25rem", marginBottom: "1.5rem" }}>
            <li>
              After many requests, we've rolled out a{" "}
              <b>promo/reward code system</b>. You'll now find a special code
              entry box on the home screen, letting you redeem limited-time and
              exclusive codes for instant in-game bonuses.
            </li>
            <li>
              This system is fully integrated with the backend—codes can only be
              redeemed once per player, and your unlocks are always saved.
              Future event codes, influencer codes, and hidden rewards are all
              supported.
            </li>
            <li>
              <b>Note:</b> We are not publicly listing all promo codes yet—keep
              your eyes peeled on our Discord, future dev logs, and (maybe) some
              YouTube collaborations!
            </li>
          </ul>

          <h3 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>
            First Creator Partnership: Maddox!
          </h3>
          <ul style={{ paddingLeft: "1.25rem", marginBottom: "1.5rem" }}>
            <li>
              TapTapTwo is proud to announce its first ever sponsored content
              and community creator collaboration with <b>Maddox</b>!
            </li>
            <li>
              To celebrate, we've added an exclusive, animated "Maddox Football
              Stadium" theme and matching Maddox profile icon. These can be
              earned in-game and really show off if you're an OG supporter.
            </li>
            <li>
              Maddox brings a ton of energy and a real community spirit to the
              game—check out his channel for VRFS and more:{" "}
              <a
                href="https://www.youtube.com/channel/UCVXk-ixAOlk9we-5yFfKN9g"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#2563eb", textDecoration: "underline" }}
              >
                https://www.youtube.com/channel/UCVXk-ixAOlk9we-5yFfKN9g
              </a>
              .
            </li>
            <li>
              Expect more YouTuber tie-ins, collab unlocks, and limited
              influencer rewards in the months to come!
            </li>
          </ul>

          <h3 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>
            Themes & Visual Overhaul
          </h3>
          <ul style={{ paddingLeft: "1.25rem", marginBottom: "1.5rem" }}>
            <li>
              <b>Massive theme expansion:</b> Every season (Spring, Summer,
              Autumn, Winter) now has a completely unique background, and we've
              added a whole gallery of special themes including City Night,
              Midnight, Island, Barn, and more.
            </li>
            <li>
              The game now automatically corrects theme display names, so you'll
              never see "city_night" or "maddoxtheme" as the title. Every theme
              is presented cleanly with proper formatting across all menus and
              the shop.
            </li>
            <li>
              Major improvements to the background animation engine make
              everything feel smoother, brighter, and more alive. All effects
              scale perfectly on desktop and mobile.
            </li>
            <li>
              Switching between themes is now instant and seamless—no more
              flicker, layout breakage, or stuck visual effects.
            </li>
          </ul>

          <h3 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>
            Expanded Shop, Limiteds, and Icon Collecting
          </h3>
          <ul style={{ paddingLeft: "1.25rem", marginBottom: "1.5rem" }}>
            <li>
              The shop has been fully rebuilt and now features a large
              collection of <b>profile icons</b>, unlockable backgrounds, and a
              new "Limited" tab for rare, time-limited content.
            </li>
            <li>
              Every purchase and unlock is saved server-side. No more "missing
              icon" bugs, lost purchases, or duplicate redemptions.
            </li>
            <li>
              Limited items are strictly <b>first-come, first-served</b>. When a
              Limited sells out, it's permanently gone.
            </li>
            <li>
              The entire icon roster has been expanded—expect even more in
              future events.
            </li>
          </ul>

          <h3 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>
            Polish, Bug Fixes, & Backend Upgrades
          </h3>
          <ul style={{ paddingLeft: "1.25rem", marginBottom: "1.5rem" }}>
            <li>
              <b>Massive theme and icon name cleanup:</b> All names are now
              displayed cleanly everywhere. No more leaking raw IDs or code
              names.
            </li>
            <li>
              <b>Fixed all modal and input UI bugs</b>. Every notification,
              popup, and text box is now correctly styled, positioned, and
              responsive.
            </li>
            <li>
              Various edge-case bugs have been fixed, especially with theme
              switching, inventory management, and reward code redemption.
            </li>
            <li>
              The backend now saves and loads everything more reliably—no more
              "game save not found" errors on slow connections.
            </li>
            <li>
              Game performance, responsiveness, and animation smoothness are all
              improved—especially on mobile.
            </li>
          </ul>

          <h3 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>
            The Road Ahead
          </h3>
          <ul style={{ paddingLeft: "1.25rem", marginBottom: "1.5rem" }}>
            <li>
              Watch for more{" "}
              <b>limited drops, theme contests, and icon events</b> coming soon.
              Community input is now much easier to implement thanks to the new
              backend!
            </li>
            <li>
              Hidden codes, seasonal secrets, and maybe even "prestige-only"
              unlocks are on the way.
            </li>
            <li>
              We're working on permanent boosts, timed multipliers, and new
              social features—keep sending feedback.
            </li>
          </ul>

          <p
            style={{
              fontStyle: "italic",
              color: "#666666",
              fontSize: "0.97rem",
              marginTop: "1.5rem",
            }}
          >
            Thanks as always for playing, sharing, and supporting TapTapTwo.
            This was the most ambitious update yet, and we're only getting
            started. Get collecting, try out the new features, and watch for
            more surprises soon.
            <br />
            Andy
          </p>
        </div>
      ),
      created_at: "22:05",
    },
    {
      id: 7,
      title: "Dev Log #7 - 13/07/25",
      created_at: "23:00",
      content: (
        <div
          style={{
            fontFamily:
              "'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            lineHeight: 1.7,
            color: "#2d3748",
            fontSize: "1.05rem",
            letterSpacing: "0.02em",
          }}
        >
          <p
            style={{
              fontStyle: "italic",
              color: "#555555",
              fontSize: "0.97rem",
              marginBottom: "1.5rem",
              maxWidth: "90%",
              lineHeight: 1.6,
            }}
          >
            Hey guys. This is the major one. The fourth update. The important
            update. I'm actually really happy the way this is turning out.
            Welcome to...
          </p>

          <h2
            style={{
              fontFamily: "'Crimson Text', serif",
              fontWeight: 700,
              fontSize: "2.2rem",
              color: "#1e293b",
              letterSpacing: "0.05em",
              margin: 0,
              marginBottom: "2rem",
              textAlign: "left",
            }}
          >
            The{" "}
            <span style={{ color: "#3b82f6", fontWeight: 700 }}>
              Cold Night
            </span>{" "}
            Update
          </h2>

          <h3
            style={{ color: "#1e1e1e", fontWeight: 700, marginTop: "1.3rem" }}
          >
            Major Theme Additions
          </h3>
          <ul style={{ paddingLeft: "1.5rem", marginBottom: "1.5rem" }}>
            <li>
              <b style={{ color: "#1e1e1e" }}>Space Theme:</b> Features a full
              animated starfield with moving planets and diagonal shooting
              stars. Utilizes real parallax layers to create depth and
              immersion. The background is predominantly black and dark gray,
              providing a sleek, modern night-time look. The theme{" "}
              <i>scales perfectly</i> across all devices, ensuring no stretching
              or cut-off visuals.
            </li>
            <li>
              <b style={{ color: "#60a5fa" }}>Heaven Theme:</b> Combines soft
              white and light blue gradients, featuring centered pearly gates
              and floating clouds. The overall vibe is airy and serene with
              gentle glowing effects. This theme creates a calming atmosphere
              with clean, bright visuals.
            </li>
            <li>
              <b style={{ color: "#dc2626" }}>Hell Theme:</b> Dominated by deep
              reds and solid blacks, this theme includes a strong black vignette
              and drifting glowing embers. The animations are smooth and never
              obstruct the UI or scrolling. It keeps the interface clear while
              maintaining an intense, fiery aesthetic.
            </li>
            <li>
              Theme switching is now <b>instantaneous</b>, with no flickering or
              lag. All background effects properly clean up and reset when
              changing themes to prevent any visual glitches.
            </li>
            <li>
              All backgrounds are rendered in <b>high resolution</b> and are
              fully responsive, with <b>no forced horizontal scrolling</b> on
              any device.
            </li>
          </ul>

          <h3
            style={{ color: "#b91c1c", fontWeight: 700, marginTop: "1.5rem" }}
          >
            The Shop Tab
          </h3>
          <ul style={{ paddingLeft: "1.5rem", marginBottom: "1.5rem" }}>
            <li>
              The <b>Shop</b> is now live and accessible from the main menu.
              Players can browse unlockable <b>themes</b>, new{" "}
              <b>profile icons</b>, and soon, limited-edition items.
            </li>
            <li>
              Purchases in the shop are made using <b>Renown Tokens</b>. Each
              item's price and availability are clearly displayed. All ownership
              and inventory data is saved permanently per account.
            </li>
            <li>
              Limited items will be released shortly. These are strictly{" "}
              <i>first-come, first-served</i> — once sold out, they will not
              return. A dedicated "Limited" section has been added to the shop
              interface.
            </li>
          </ul>

          <h3
            style={{ color: "#3b82f6", fontWeight: 700, marginTop: "1.5rem" }}
          >
            Profile Icons
          </h3>
          <ul style={{ paddingLeft: "1.5rem", marginBottom: "1.5rem" }}>
            <li>
              New <b>Profile Icons</b> can now be collected and equipped through
              the Shop. These icons add personalization and flair to your
              profile.
            </li>
            <li>
              All owned icons and the equipped selection are saved per player
              account, allowing for easy switching at any time.
            </li>
          </ul>

          <h3
            style={{ color: "#dc2626", fontWeight: 700, marginTop: "1.5rem" }}
          >
            Renown Token Rebalancing
          </h3>
          <ul style={{ paddingLeft: "1.5rem", marginBottom: "1.5rem" }}>
            <li>
              The cost to earn <b>Renown Tokens</b> has been{" "}
              <i>exponentially rebalanced</i>. The first token now requires{" "}
              <b>50 million coins</b>. Each subsequent token costs significantly
              more, making it advantageous to save longer before resetting.
            </li>
            <li>
              This new scaling applies to all resets and renown earnings moving
              forward. The longer you wait, the greater your token rewards will
              be.
            </li>
          </ul>

          <h3
            style={{ color: "#3b82f6", fontWeight: 700, marginTop: "1.5rem" }}
          >
            Visual & UI Polish
          </h3>
          <ul style={{ paddingLeft: "1.5rem", marginBottom: "1.5rem" }}>
            <li>
              All theme colors, gradients, and UI highlights have been refined
              and brightened for enhanced clarity and consistency.
            </li>
            <li>
              Buttons, modals, and other interactive elements have been updated
              for uniform styling across all screens.
            </li>
            <li>
              General improvements to layout and mobile scroll performance
              provide a smoother and more intuitive user experience.
            </li>
          </ul>

          <h3 style={{ fontWeight: 700, marginTop: "1.5rem" }}>
            Coming Soon...
          </h3>
          <ul style={{ paddingLeft: "1.5rem", marginBottom: "1.5rem" }}>
            <li>
              <span style={{ fontStyle: "italic", color: "#6b7280" }}>
                Boosts and limited-time shop offers are scheduled for the next
                update.
              </span>
              <br />
              <span style={{ fontStyle: "italic", color: "#6b7280" }}>
                Expect permanent upgrades, timed multipliers, and a few
                surprises—stay tuned.
              </span>
            </li>
          </ul>

          <p
            style={{
              fontStyle: "italic",
              color: "#555555",
              fontSize: "0.97rem",
              marginTop: "1.7rem",
            }}
          >
            Again, thanks guys! I'm working on the shop, so start saving those
            Renown Tokens. Thank you & I love you all.
            <br />
            Andy
          </p>
        </div>
      ),
    },
    {
      id: 6,
      title: "Dev Log #6 - 11/07/25",
      content: (
        <div
          style={{
            fontFamily:
              "'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            lineHeight: 1.7,
            color: "#2d3748",
            fontSize: "1.05rem",
            letterSpacing: "0.02em",
          }}
        >
          <p
            style={{
              fontStyle: "italic",
              color: "#666666",
              fontSize: "0.97rem",
              marginBottom: "1.5rem",
              maxWidth: "90%",
              lineHeight: 1.6,
            }}
          >
            Hello! I'm back with a few new updates to rebalance the game. I hope
            you're all enjoying it. I'm really glad I can bring you...
          </p>

          <h2
            style={{
              fontFamily: "'Crimson Text', serif",
              fontWeight: 700,
              fontSize: "2.2rem",
              color: "#2d3748",
              letterSpacing: "0.05em",
              margin: 0,
              marginBottom: "2rem",
              textAlign: "left",
            }}
          >
            The{" "}
            <span style={{ color: "#22c55e", fontWeight: 700 }}>
              Falling Leaves
            </span>{" "}
            Update
          </h2>

          <p style={{ marginBottom: "1.5rem" }}>
            The most significant update this season is the introduction of{" "}
            <b>Renown Tokens</b>, which now replace the previous reset
            requirements.
            <br />- Instead of accumulating a high number of house and combined
            upgrades, you can now prestige by reaching 5 million coins. However,
            it's worth considering your timing—waiting longer before resetting
            will earn you more Renown Tokens in one go.
            <br />- Renown Tokens provide a permanent 5% boost to your earnings
            per tap for each token, making future progress easier. These tokens
            will also play an important role in upcoming features—so start
            collecting!
          </p>

          <h3 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>
            Introduction of the Shop Tab
          </h3>
          <ul style={{ paddingLeft: "1.25rem", marginBottom: "1.5rem" }}>
            <li>
              The Shop tab is currently in development and will offer a variety
              of items such as profile icons, themed backgrounds, and exclusive
              limited-edition content.
            </li>
            <li>
              Some limited items will only be available to a small number of
              players on a first-come, first-served basis, with a minimum
              quantity of two for each limited.
            </li>
            <li>
              Items will be purchasable using Renown Tokens, coins, or both.
              Expected pricing for most items will be between 100–500 Renown
              Tokens, with limited items potentially costing upwards of 3,000.
              Details to follow at launch.
            </li>
          </ul>

          <h3 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>
            Colour Refresh
          </h3>
          <ul style={{ paddingLeft: "1.25rem", marginBottom: "1.5rem" }}>
            <li>
              All in-game colours have been carefully adjusted and brightened.
              Menus, backgrounds, and interface highlights now provide improved
              visibility and a more engaging visual experience.
            </li>
            <li>
              These changes improve button and icon clarity, enhance
              readability, and contribute to a fresher, more cohesive autumn
              theme.
            </li>
            <li>
              The palette has been refined to ensure consistency and
              accessibility across both light and dark backgrounds.
            </li>
          </ul>

          <h3 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>
            Help Board / Notice Board
          </h3>
          <ul style={{ paddingLeft: "1.25rem", marginBottom: "1.5rem" }}>
            <li>
              A new Help Board has been added, featuring a comprehensive guide
              to the game, available from the top bar (<b>?</b> icon).
            </li>
            <li>
              The Help Board has been completely rebuilt for mobile devices to
              ensure optimal accessibility and usability.
            </li>
          </ul>

          <h3 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>
            Double Earnings Button (Sacrifice)
          </h3>
          <ul style={{ paddingLeft: "1.25rem", marginBottom: "1.5rem" }}>
            <li>
              A new Double Earnings (Sacrifice) button is now available. To
              activate, you'll need at least 10 upgrades of a single type or 1
              house upgrade.
            </li>
            <li>
              Use this option to receive a permanent 2x boost to your offline
              earnings. This reward is available only once per game.
            </li>
          </ul>

          <h3 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>
            Redesigned Login and Sign Up Page
          </h3>
          <ul style={{ paddingLeft: "1.25rem", marginBottom: "1.5rem" }}>
            <li>
              Both login and sign-up screens have been fully redesigned to match
              the current game aesthetic, providing a more streamlined and
              welcoming experience.
            </li>
          </ul>

          <h3 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>
            General Bug Fixes
          </h3>
          <ul style={{ paddingLeft: "1.25rem", marginBottom: "1.5rem" }}>
            <li>Resolved various UI glitches and inconsistencies.</li>
            <li>Addressed several minor bugs to enhance game stability.</li>
            <li>
              Improved overall performance and responsiveness, especially on
              mobile.
            </li>
            <li>Fixed the logo alignment on mobile devices.</li>
            <li>Corrected hail weather effects.</li>
            <li>
              Lifetime statistics for total taps and coins are now properly
              tracked and displayed.
            </li>
          </ul>

          <p
            style={{
              fontStyle: "italic",
              color: "#666666",
              fontSize: "0.97rem",
              marginTop: "1.5rem",
            }}
          >
            Again, thanks guys! I'm working on the shop, so start saving those
            Renown Tokens. Thank you & I love you all.
            <br />
            Andy
          </p>
        </div>
      ),
      created_at: "01:04",
    },
    {
      id: 5,
      title: "Dev Log #5 - 08/07/25",
      content: (
        <div
          style={{
            fontFamily:
              "'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            lineHeight: 1.7,
            color: "#2d3748",
            fontSize: "1.05rem",
            letterSpacing: "0.02em",
          }}
        >
          <p
            style={{
              fontStyle: "italic",
              color: "#666666",
              fontSize: "0.97rem",
              marginBottom: "1.5rem",
              maxWidth: "90%",
              lineHeight: 1.6,
            }}
          >
            Hey guys - Here we are again with another round of updates. This
            update brings some UI changes, some rebalancing and some new
            features! I'm still really enjoying the time I'm spending with this
            game, and I promise to iron out the major bugs over the coming days!
            <br />
            <br />
            For now, here is the
          </p>

          <h2
            style={{
              fontFamily: "'Crimson Text', serif",
              fontWeight: 700,
              fontSize: "2.2rem",
              color: "#2d3748",
              letterSpacing: "0.05em",
              margin: 0,
              marginBottom: "2rem",
              textAlign: "left",
            }}
          >
            The{" "}
            <span style={{ color: "#facc15", fontWeight: 700 }}>
              Summer Heat
            </span>{" "}
            Update
          </h2>

          <h3 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>
            Weather System Tweaks
          </h3>
          <ul style={{ paddingLeft: "1.25rem", marginBottom: "1.5rem" }}>
            <li>
              New animated effects added for Cloudy, Foggy and Sleet weather
              conditions, enhancing the visual immersion and player experience
              during these weathers.
            </li>
            <li>
              The Snow effect now displays correctly, fixing previous issues
              where it said "Snow has no effect".
            </li>
            <li>
              Weather probabilities for Spring and Summer have been adjusted to
              better balance gameplay and create more realistic seasons.
            </li>
          </ul>

          <h3 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>
            Upgrade System Improvements
          </h3>
          <ul style={{ paddingLeft: "1.25rem", marginBottom: "1.5rem" }}>
            <li>
              Complete re-balance of all upgrade costs and improvements to
              optimize game progression, pacing, and player satisfaction.
            </li>
            <li>
              The Autotapper specifically has been made significantly stronger,
              increasing the incremental effect per upgrade to +250. This makes
              the Autotapper more valuable and encourages players to invest in
              it as a meaningful gameplay element.
            </li>
          </ul>

          <h3 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>
            UI Fixes/Changes
          </h3>
          <ul style={{ paddingLeft: "1.25rem", marginBottom: "1.5rem" }}>
            <li>
              Added a dropdown menu on the top bar to declutter the interface by
              grouping less frequently used actions, such as feedback,
              noticeboard, profile, and logout options.
            </li>
            <li>
              Players can now complete a quest in order to receive a 10 minute
              10x Boost to their income, replacing the old "Watch Ad" button
              that was not implemented.
            </li>
            <li>
              Added a profile section, where you can update your name for the
              leaderboard, reset your game entirely, or change your PIN.
            </li>
          </ul>

          <p
            style={{
              fontStyle: "italic",
              color: "#666666",
              fontSize: "0.97rem",
              marginTop: "1.5rem",
            }}
          >
            Small bug fixes & UI optimizations have happened on top of the
            above, but the rest is not as important, and not worth mentioning
            individually.
            <br />
            Thanks for testing, as usual guys, and keep tapping! I love you all,
            still.
          </p>
        </div>
      ),
      created_at: "20:00",
    },
    {
      id: 4,
      title: "DevLog #4 - 06/07/25",
      content: (
        <div
          style={{
            fontFamily:
              "'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            lineHeight: 1.7,
            color: "#2d3748",
            fontSize: "1.05rem",
            letterSpacing: "0.02em",
          }}
        >
          <p
            style={{
              fontStyle: "italic",
              color: "#666666",
              fontSize: "0.97rem",
              marginBottom: "1.5rem",
              maxWidth: "90%",
              lineHeight: 1.6,
            }}
          >
            Hey Guys, <br />
            <br />
            I've been hard at work this week creating something I can actually
            be proud of, and thanks to feedback and staying motivated, I've
            managed to make what I can probably call "1.0".
            <br />
            <br />
            I'm currently working on creating a new version of this game with my
            own domain, databases etc.
            <br />
            I'd just like to say thanks. I'm working hard on creating a mobile
            app too, we'll see how that goes.
            <br />
            <br />
            Thanks guys, here is:
            <br />
          </p>
          <h2
            style={{
              fontFamily: "'Crimson Text', serif",
              fontWeight: 700,
              fontSize: "2.2rem",
              color: "#2d3748", // or remove this line for default
              letterSpacing: "0.05em",
              margin: 0,
              marginBottom: "2rem",
              textAlign: "left",
            }}
          >
            The{" "}
            <span style={{ color: "#86efac", fontWeight: 700 }}>
              Spring Bloom
            </span>{" "}
            Update
          </h2>

          <ul
            style={{
              marginTop: "1.5rem",
              marginBottom: "1.5rem",
              paddingLeft: "1.25rem",
            }}
          >
            <li>
              <b>Added Daily Bonus (2pm everyday)</b>
              <div
                style={{
                  marginLeft: "1.5rem",
                  marginTop: "0.5rem",
                  marginBottom: "0.5rem",
                }}
              >
                A new daily bonus system triggers at exactly 2pm (server time)
                each day. When players log in after this time, they can claim a
                single randomized reward from a prize pool. The system uses
                weighted probabilities to determine each reward, with the pool
                including Tap Power upgrades (+1, +3, +5, +10), coin boosts
                (+10%, +25%, +50% of current balance), House level ups (+1, +2,
                +3), and temporary multipliers (+10%, +50%, +500% for 24 hours).
                A timer and last-claim tracker prevent abuse, and the UI shows a
                modal or popup with your exact prize and when the next claim is
                allowed. All logic is stored per user, including cooldown and
                eligibility, with error handling if a player attempts to claim
                early or repeatedly.
              </div>
            </li>
            <li>
              <b>Added "made by andysocial" credit near logo</b>
              <div
                style={{
                  marginLeft: "1.5rem",
                  marginTop: "0.5rem",
                  marginBottom: "0.5rem",
                }}
              >
                The static text "made by andysocial" is now directly placed by
                the game logo on the Noticeboard and home screen. This is styled
                for visibility, stays locked near the logo no matter the device
                or page, and does not overlap other elements.
              </div>
            </li>
            <li>
              <b>Fixed Name Dupe Glitch on Upgrade Titles</b>
              <div
                style={{
                  marginLeft: "1.5rem",
                  marginTop: "0.5rem",
                  marginBottom: "0.5rem",
                }}
              >
                There was a UI bug where rapid tab switching or spam upgrading
                would cause upgrade titles (like "Tap Power" or "Auto Tapper")
                to repeat, stack, or overlap. This is now fully fixed; upgrade
                titles always render from a single source of truth and are no
                longer duplicated or desynced under any circumstances,
                regardless of tab, window resize, or upgrade events.
              </div>
            </li>
            <li>
              <b>Added logo to Noticeboard</b>
              <div
                style={{
                  marginLeft: "1.5rem",
                  marginTop: "0.5rem",
                  marginBottom: "0.5rem",
                }}
              >
                The Tap Tap Two logo is now rendered prominently at the top of
                the Noticeboard page, using a responsive image with set max and
                min heights, so it always looks good regardless of screen size.
                This branding unifies the look and helps users instantly
                recognize the page.
              </div>
            </li>
            <li>
              <b>Added % Progress Icon on Reset Module</b>
              <div
                style={{
                  marginLeft: "1.5rem",
                  marginTop: "0.5rem",
                  marginBottom: "0.5rem",
                }}
              >
                The reset module now visually displays your exact percent
                progress toward the reset requirement. This is calculated as
                ((combined upgrade level + house level) / reset threshold) and
                is shown both as a progress bar and a percentage value, so you
                always know exactly how close you are to your next reset,
                removing any guesswork.
              </div>
            </li>
            <li>
              <b>Added Level Counters to each Upgrade</b>
              <div
                style={{
                  marginLeft: "1.5rem",
                  marginTop: "0.5rem",
                  marginBottom: "0.5rem",
                }}
              >
                Each upgrade button now displays your current upgrade level
                (e.g., "Level 38"), updated in real time. This number always
                matches your backend state and immediately updates with every
                purchase, reset, or load, so you never have to guess your
                upgrade progress.
              </div>
            </li>
            <li>
              <b>Added Combined Upgrade Level Counter</b>
              <div
                style={{
                  marginLeft: "1.5rem",
                  marginTop: "0.5rem",
                  marginBottom: "0.5rem",
                }}
              >
                There's now a single combined level number on the upgrades
                screen, adding up Tap Power, Auto Tapper, Crit Chance, and Speed
                Bonus. This combined value is used for season changes (every 50
                levels) and for determining reset requirements, giving you a
                clear target to hit for your next milestone.
              </div>
            </li>
            <li>
              <b>More Rebalancing on Costs for Upgrades</b>
              <div
                style={{
                  marginLeft: "1.5rem",
                  marginTop: "0.5rem",
                  marginBottom: "0.5rem",
                }}
              >
                All four upgrade types have new cost curves. Early levels are
                much cheaper so you can get started faster. However, Critical
                Chance and Speed Bonus upgrades in particular become
                significantly more expensive at higher levels (with price curves
                steepening after about level 70 and again after 100), so you
                can't just spam one stat forever. Late-game upgrades are tuned
                for a smoother but steeper grind, encouraging more strategic
                coin use and making the challenge feel fair but tough at the
                top.
              </div>
            </li>
          </ul>

          <p
            style={{
              fontStyle: "italic",
              color: "#666666",
              fontSize: "0.97rem",
              marginTop: "2rem",
              fontFamily: "'Inter', sans-serif",
            }}
          >
            Again, thanks guys. I love you all!
          </p>
        </div>
      ),
      created_at: "00:05",
    },
  ];

  return (
    <div
      className={`min-h-screen bg-gradient-to-br ${seasonBackgrounds[currentSeason]} p-2 transition-colors duration-700`}
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div className="max-w-3xl mx-auto bg-white/30 backdrop-filter backdrop-blur-lg rounded-2xl p-2 shadow-lg">
        {/* 1. Back to Home button - very top, left aligned */}
        <div className="flex justify-start mb-4">
          <button
            onClick={() => {
              window.location.href = "/";
            }}
            className="px-5 py-3 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold transition"
          >
            ← Back to Home
          </button>
        </div>

        {/* 2. Logo - centered and large */}
        <div className="flex flex-col items-center justify-center mb-0">
          <img
            src="https://ucarecdn.com/7bdd361d-c411-41ce-b066-c1d20f88e3a7/-/format/auto/"
            alt="Tap Tap Two Logo"
            style={{
              height: "11rem",
              objectFit: "contain",
              margin: "0 auto",
              marginBottom: "-1.5rem",
              display: "block",
            }}
          />
        </div>

        {/* 3. Noticeboard Title - centered, right under logo */}
        <div className="flex flex-col items-center justify-center mt-0 mb-8">
          <h2
            style={{
              fontFamily: "'Crimson Text', serif",
              fontWeight: 700,
              fontSize: "2.5rem",
              color: "#2d3748",
              letterSpacing: "0.04em",
              textAlign: "center",
              margin: 0,
              lineHeight: 1.1,
            }}
          >
            Tap Board
          </h2>
        </div>

        {/* 4. Notices */}
        {notes.length === 0 ? (
          <div className="text-center text-[#4a5568] text-lg">
            No notices yet. Check back later!
          </div>
        ) : (
          <div className="space-y-10">
            {notes.map((note) => (
              <article
                key={note.id}
                className="bg-white/70 rounded-2xl p-8 shadow-md border border-white/40"
              >
                <h3
                  style={{
                    fontFamily: "'Crimson Text', serif",
                    fontWeight: 600,
                    fontSize: "1.5rem",
                    color: "#2d3748",
                    marginBottom: "1rem",
                    letterSpacing: "0.04em",
                  }}
                >
                  {note.title}
                </h3>
                <div className="text-[#4a5568] whitespace-pre-wrap">
                  {note.content}
                </div>
                <footer className="text-sm text-[#718096] mt-6 text-right">
                  Posted: {note.created_at}
                </footer>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MainComponent;