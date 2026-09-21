.PHONY: build-ProcessorFunction build-ReconciliationFunction build-DashboardFunction build-AnalysisFunction

build-ProcessorFunction:
	python -m pip install -r requirements.txt -t "$(ARTIFACTS_DIR)" --no-cache-dir
	cp -R app "$(ARTIFACTS_DIR)/app"

build-ReconciliationFunction:
	python -m pip install -r requirements.txt -t "$(ARTIFACTS_DIR)" --no-cache-dir
	cp -R app "$(ARTIFACTS_DIR)/app"

build-DashboardFunction:
	python -m pip install -r requirements.txt -t "$(ARTIFACTS_DIR)" --no-cache-dir
	cp -R app "$(ARTIFACTS_DIR)/app"

build-AnalysisFunction:
	python -m pip install -r requirements.txt -t "$(ARTIFACTS_DIR)" --no-cache-dir
	cp -R app "$(ARTIFACTS_DIR)/app"
	cp global-bundle.pem "$(ARTIFACTS_DIR)/global-bundle.pem"