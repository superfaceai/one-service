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

    <link rel="stylesheet" href="https://unpkg.com/graphiql@2.4.0/graphiql.min.css" />
    <link
      rel="stylesheet"
      href="https://unpkg.com/@graphiql/plugin-explorer@0.1.14/dist/style.css"
    />
  </head>

  <body>
    <div id="graphiql">Loading...</div>

    <script
      src="https://unpkg.com/react@17.0.2/umd/react.production.min.js"
      integrity="sha384-7Er69WnAl0+tY5MWEvnQzWHeDFjgHSnlQfDDeWUvv8qlRXtzaF/pNo18Q2aoZNiO"
      crossorigin="anonymous"
    ></script>
    <script
      src="https://unpkg.com/react-dom@17.0.2/umd/react-dom.production.min.js"
      integrity="sha384-vj2XpC1SOa8PHrb0YlBqKN7CQzJYO72jz4CkDQ+ePL1pwOV4+dn05rPrbLGUuvCv"
      crossorigin="anonymous"
    ></script>
    <script
      src="https://unpkg.com/graphiql@2.4.0/graphiql.min.js"
      integrity="sha384-MVcRONLrOPBea05C9lB5pu31zTbPkbZI/gIn2y0r5xH6GefRkJcnrBGlY4zo2nwC"
      crossorigin="anonymous"
    ></script>
    <script
      src="https://unpkg.com/@graphiql/plugin-explorer@0.1.14/dist/graphiql-plugin-explorer.umd.js"
      integrity="sha384-rbN7vYh67VVbUGRkgCVTFu0Pk25KR5Ns9b6sOyPHf5GiYat1ce44UEF5I+HqE2Dg"
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
