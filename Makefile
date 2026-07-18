.PHONY: dev build preview test test-unit test-e2e sync sync-diff check-projects clean serve

dev:
	npm run dev

build:
	npm run build

preview:
	npm run preview

test-unit:
	npm run test:unit

test-e2e:
	npm run test:e2e

test: test-unit test-e2e

sync:
	npm run projects:sync

# Run the sync script and show exactly what it changed in the yaml.
sync-diff:
	git diff --no-color -- src/data/projects.config.yaml || true
	@npm run projects:sync
	@echo "--- diff after sync ---"
	git diff --no-color -- src/data/projects.config.yaml || true

# Build and print which projects actually made it onto the page,
# so you can confirm include:true/false is doing what you expect.
check-projects: build
	@echo "--- pinned + listed projects in dist/projects/index.html ---"
	@grep -oE 'font-display text-\[17px\][^<]*>[^<]+' dist/projects/index.html | sed -E 's/.*>//'

clean:
	rm -rf dist .astro

# Sync latest repos, build, then serve the built site (prints the local URL).
serve: sync build
	npm run preview
