# Iterative refinement

The prompt chain I use to start projects with AI: a brainstorm, a blueprint loop, then a starter repo. Warmed up, then kept on the burner until I have time for it.

The walkthrough, with a copy button on every prompt: https://mike-byrne-ai.github.io/iterative-refinement/

## The blueprint loop

Run these in order, in one conversation. Put your idea where the first one says (OBJECTIVE).

### Blueprint 1: The blueprint

```text
Let's do a deep brainstorm session on
(OBJECTIVE)
We want to look at every angle we can find and vet the idea so an expert would be satisfied with the results. Make sure to ground the idea in strong engineering ideals, and only build towards a real attainable outcome. Let's make a detailed blueprint that outlines the build.
```

### Blueprint 2: Expand the blueprint

```text
Let's do a deep dive on researching this idea. Now that we have the blueprint, let's keep expanding and adding to this. Why has this not been brought to market yet? What are the known issues and pitfalls of building in this area?
```

### Blueprint 3: The final blueprint

```text
Let's do a final round looking across all the context here. The goal is to find emergent possibilities and ideas that only come into view when all of this context can be cross analyzed. Look for new ideas, product forks, experiments, insights, tooling, and anything potentially useful. Make a final blueprint that lets us start to build this idea, and build it with future agentic engineering in mind. We want agents to be able to understand and build from this blueprint easily.
```

## The starter repo

A stronger model turns the final blueprint into a starter repo. Then these rounds develop it, in order.

### Repo 1: Review

```text
We built this with my iterative refinement method. An idea was expanded to a blueprint, then the blueprint expanded to a starter repo. Let's deeply review and assess the repo, the quality of its build and code, the research it packages as reference material, and the objective it is proposing to work on.
```

### Repo 2: Repair and build

```text
Let's take this information, add it to the repo, then make all repairs and improvements you can see. Let's also make sure to really put effort into the objective itself. Let's do a few of the tasks this repo is pointing towards, and make sure this work is held to the highest standards.
```

### Repo 3: Research dive

```text
Let's do another deep external research dive. Look at any and all relevant science, known methods and open source tools and methods, and update the repo's scientific and prior art libraries. We want this repo to start from the most educated standpoint we can, with info ready for cross analysis and reference. As we research, let's apply any learned knowledge from the new info and from the last turn to continue working the objective so the next snapshot has new info and new results.
```

### Repo 4: Final round

```text
Let's do a final round of review and building. We are looking for emergent opportunities, experiment ideas, forks, s-tier tools that just became visible. We also want a doc at repo root that is a short summary of the repo, called summary.md. During this time, we want to keep an eye out for unique cross connections, and new ideas. Let's advance the objective forward during this build as well. Where we are building and looking for emergent opportunities, let's try to make this the example of a ‘perfect’ repo that one might imagine when asked.
```

## Licence

MIT-0 (see LICENSE): copy and use the prompts freely, no credit needed. The fonts in assets/fonts are under the SIL Open Font License; their licence files sit beside them.

This page and the site were drafted with AI from my own notes: Mike × AI.
