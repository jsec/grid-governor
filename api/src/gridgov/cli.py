import typer

app = typer.Typer(help="Grid Governor management commands.", no_args_is_help=True)


@app.callback()
def main() -> None:
    """Grid Governor management commands."""


if __name__ == "__main__":
    app()
