FROM python:3.11

RUN mkdir -p /app
WORKDIR /app

COPY requirements.txt /requirements.txt
RUN pip install -U pip && \
    pip install -r /requirements.txt

COPY . /app/

EXPOSE 8080

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
