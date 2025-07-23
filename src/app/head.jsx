// app/head.jsx
export default function Head() {
  return (
    <>
      <title>Tap Tap Two</title>
-     <meta name="viewport" content="width=device-width, initial-scale=1" />
+     <meta
+       name="viewport"
+       content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
+     />
    </>
  );
}
