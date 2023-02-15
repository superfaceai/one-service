import { Request, Response } from 'express';

export function renderGraphiQL(_req: Request, res: Response): void {
  res.send(`
<!DOCTYPE html>
<html lang="en">
  <head>
    <title>OneService - Graphiql</title>
    <style>
      body {
        height: 100%;
        margin: 0;
        width: 100%;
        overflow: hidden;
      }

      #graphiql {
        height: 100vh;
      }
    </style>

    <link rel="stylesheet" href="https://unpkg.com/graphiql/graphiql.min.css" />
    <link
      rel="stylesheet"
      href="https://unpkg.com/@graphiql/plugin-explorer/dist/style.css"
    />
  </head>

  <body>
    <div id="graphiql">Loading...</div>

    <script
      src="https://unpkg.com/react@17/umd/react.development.js"
      integrity="sha512-Vf2xGDzpqUOEIKO+X2rgTLWPY+65++WPwCHkX2nFMu9IcstumPsf/uKKRd5prX3wOu8Q0GBylRpsDB26R6ExOg=="
      crossorigin="anonymous"
    ></script>
    <script
      src="https://unpkg.com/react-dom@17/umd/react-dom.development.js"
      integrity="sha512-Wr9OKCTtq1anK0hq5bY3X/AvDI5EflDSAh0mE9gma+4hl+kXdTJPKZ3TwLMBcrgUeoY0s3dq9JjhCQc7vddtFg=="
      crossorigin="anonymous"
    ></script>
    <script
      src="https://unpkg.com/graphiql/graphiql.min.js"
      integrity="sha512-FVCV2//UVo1qJ3Kg6kkHLe0Hg+IJhjrGa+aYHh8xD4KmwbbjthIzvaAcCJsQgA43+k+6u7HqORKXMyMt82Srfw=="
      crossorigin="anonymous"
    ></script>
    <script
      src="https://unpkg.com/@graphiql/plugin-explorer@0.1.12/dist/graphiql-plugin-explorer.umd.js"
      integrity="sha512-Fjas/uSkzvsFjbv4jqU9nt4ulU7LDjiMAXW2YFTYD96NgKS1fhhAsGR4b2k2VaVLsE29aia3vyobAq9TNzusvA=="
      crossorigin="anonymous"
    ></script>

    <script>
      var fetcher = GraphiQL.createFetcher({
        url: "/graphql"
      });

      function GraphiQLWithExplorer() {
        var [query, setQuery] = React.useState();
        var explorerPlugin = GraphiQLPluginExplorer.useExplorerPlugin({
          query,
          onEdit: setQuery,
        });
        return React.createElement(GraphiQL, {
          fetcher,
          defaultEditorToolsVisibility: true,
          plugins: [explorerPlugin],
          query,
          onEditQuery: setQuery,
        });
      }

      ReactDOM.render(
        React.createElement(GraphiQLWithExplorer),
        document.getElementById('graphiql'),
      );
    </script>
  </body>
</html>
  `);
}
